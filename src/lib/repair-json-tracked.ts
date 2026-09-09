import JSON5 from 'json5'
import { closerFor, preprocessForRepair, type Opener } from './repair-json'
import type { JsonValue } from '@/types/json'

/** A single step in a path to a value inside the parsed document: an object key or array index. */
export type PathSegment = string | number

interface ObjectFrame {
  type: 'object'
  path: PathSegment[]
  keyState: 'expecting' | 'has-key-no-colon' | 'has-key-awaiting-value'
  currentKey: string | null
  /** Whether *anything* was typed after the colon -- distinguishes "b": (truly empty) from
   *  "b": 4 (a real, if possibly incomplete, value already in progress) so we never insert a
   *  placeholder on top of data the user actually typed. */
  sawCharSinceColon: boolean
}
interface ArrayFrame {
  type: 'array'
  path: PathSegment[]
}
type Frame = ObjectFrame | ArrayFrame

function safeUnescapeJsonString(rawWithQuotes: string): string {
  if (rawWithQuotes.startsWith('"')) {
    try {
      return JSON.parse(rawWithQuotes) as string
    } catch {
      // fall through
    }
  }
  return rawWithQuotes.slice(1, -1)
}

/**
 * Same left-to-right scan as the plain repair (comments stripped, unterminated strings closed,
 * stops once the top-level value balances out), but additionally tracks *where* in the document
 * each open container sits, so a genuinely empty trailing member -- a key with no value at all --
 * can be completed with a `null` placeholder instead of deleted, and the exact path to that
 * placeholder recorded for the caller to highlight. Never removes anything the user typed.
 */
function scanTracked(text: string): { body: string; openStack: Opener[]; frames: Frame[] } {
  const openStack: Opener[] = []
  const frames: Frame[] = []
  let body = ''
  let inString = false
  let quote = ''
  let escaped = false
  let stringStart = -1
  let i = 0
  const n = text.length

  const topFrame = (): Frame | undefined => frames[frames.length - 1]

  function markValueStarted() {
    const f = topFrame()
    if (f?.type === 'object' && f.keyState === 'has-key-awaiting-value') f.sawCharSinceColon = true
  }

  function completeCurrentSlot() {
    const f = topFrame()
    if (f?.type === 'object') {
      f.keyState = 'expecting'
      f.currentKey = null
      f.sawCharSinceColon = false
    }
  }

  // Shared by both the normal in-loop close (found the matching quote) and the EOF fallback
  // below (ran out of text while still inString) -- either way, `body` already ends with the
  // string's closing quote by the time this runs, so `body.slice(stringStart)` is the complete
  // token in both cases.
  function handleStringClosed() {
    const f = topFrame()
    if (f?.type === 'object' && f.keyState === 'expecting') {
      f.keyState = 'has-key-no-colon'
      f.currentKey = safeUnescapeJsonString(body.slice(stringStart))
    } else {
      completeCurrentSlot()
    }
  }

  while (i < n) {
    const ch = text[i]!

    if (inString) {
      body += ch
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === quote) {
        inString = false
        handleStringClosed()
        if (openStack.length === 0) return { body, openStack, frames }
      }
      i++
      continue
    }

    if (ch === '"' || ch === "'") {
      markValueStarted()
      inString = true
      quote = ch
      stringStart = body.length
      body += ch
      i++
      continue
    }

    if (ch === '/' && text[i + 1] === '/') {
      while (i < n && text[i] !== '\n') i++
      continue
    }
    if (ch === '/' && text[i + 1] === '*') {
      i += 2
      while (i < n && !(text[i] === '*' && text[i + 1] === '/')) i++
      i += 2
      continue
    }

    if (ch === '{' || ch === '[') {
      markValueStarted()
      const parent = topFrame()
      const path = parent ? [...parent.path] : []
      if (parent?.type === 'object' && parent.currentKey !== null) path.push(parent.currentKey)
      openStack.push(ch)
      frames.push(
        ch === '{'
          ? { type: 'object', path, keyState: 'expecting', currentKey: null, sawCharSinceColon: false }
          : { type: 'array', path },
      )
      body += ch
      i++
      continue
    }
    if (ch === '}' || ch === ']') {
      if (openStack.length === 0) {
        i++
        continue
      }
      openStack.pop()
      frames.pop()
      body += ch
      completeCurrentSlot()
      i++
      if (openStack.length === 0) return { body, openStack, frames }
      continue
    }

    if (ch === ':') {
      const f = topFrame()
      if (f?.type === 'object' && f.keyState === 'has-key-no-colon') f.keyState = 'has-key-awaiting-value'
      body += ch
      i++
      continue
    }
    if (ch === ',') {
      completeCurrentSlot()
      body += ch
      i++
      continue
    }

    // Trailing whitespace alone (`"b":   ` then EOF) shouldn't count as "a value is in progress"
    // -- only real content does, so a key followed by nothing but blanks still gets repaired.
    if (ch !== ' ' && ch !== '\t' && ch !== '\n' && ch !== '\r') markValueStarted()
    body += ch
    i++
  }

  if (inString) {
    body += quote
    handleStringClosed()
  }
  return { body, openStack, frames }
}

export interface TrackedRepairResult {
  value: JsonValue
  /** Paths to every `null` this repair inserted in place of a genuinely missing value -- e.g.
   *  `["b"]` for a trailing `"b":` with nothing after it. Never includes structural-only fixes
   *  like an appended closing bracket, since those don't stand in for data the user was missing. */
  syntheticPaths: PathSegment[][]
}

/**
 * Repairs JSON the same way `repairJson` does, but never deletes a dangling member -- a trailing
 * `"key":` or bare `"key` with nothing after it is completed with a `null` placeholder instead of
 * being dropped, and its path is reported so the caller can flag it as synthesized rather than
 * silently passing it off as real data.
 */
export function repairJsonTracked(rawText: string): TrackedRepairResult | undefined {
  const text = preprocessForRepair(rawText)
  if (text === undefined) return undefined

  const { body, openStack, frames } = scanTracked(text)
  let candidate = body
  const syntheticPaths: PathSegment[][] = []

  // At most one frame can ever be genuinely dangling: opening a child container immediately marks
  // its parent's slot as "has a value in progress", so an ancestor of an open frame is never
  // itself dangling. Only the innermost frame needs checking.
  const innermost = frames[frames.length - 1]
  if (innermost?.type === 'object') {
    if (innermost.keyState === 'has-key-no-colon' && innermost.currentKey !== null) {
      candidate += ': null'
      syntheticPaths.push([...innermost.path, innermost.currentKey])
    } else if (
      innermost.keyState === 'has-key-awaiting-value' &&
      !innermost.sawCharSinceColon &&
      innermost.currentKey !== null
    ) {
      candidate += ' null'
      syntheticPaths.push([...innermost.path, innermost.currentKey])
    }
  }

  const closers = [...openStack].reverse().map(closerFor).join('')
  try {
    const value = JSON5.parse(candidate + closers) as JsonValue
    return { value, syntheticPaths }
  } catch {
    return undefined
  }
}
