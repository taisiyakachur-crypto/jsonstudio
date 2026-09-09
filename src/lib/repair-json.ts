import JSON5 from 'json5'
import type { JsonValue } from '@/types/json'

const MAX_TRIM_ATTEMPTS = 12

/** A line that's pure repeated punctuation (`----...`, `===...`) -- a visual separator some
 *  sources (log dumps, docs) insert between sections. Never valid JSON on its own, so it's safe
 *  to drop outright rather than let it break parsing of the real content around it. */
const DECORATIVE_LINE = /^[ \t]*[-=_*~]{3,}[ \t]*$/gm

/** Matches the start of an object member (`"key": ...`) with nothing but whitespace before it --
 *  i.e. text that looks like it was meant to be inside `{ }` but the braces got lost in copying. */
const BARE_OBJECT_MEMBER_START = /^\s*"(?:[^"\\]|\\.)*"\s*:/

type Opener = '{' | '['

function closerFor(opener: Opener): '}' | ']' {
  return opener === '{' ? '}' : ']'
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
}

/**
 * Scans once, left to right: strips `//` and `/* *\/` comments outside of strings, auto-closes
 * an unterminated string at EOF, and stops as soon as the top-level value looks complete (a
 * balanced closing bracket, or a top-level string closing its quote) -- anything after that point
 * is trailing garbage and gets dropped. Returns the still-open bracket stack so the caller can
 * close it later, after a chance to trim a dangling trailing member.
 */
function scanStructure(text: string): { body: string; openStack: Opener[] } {
  const stack: Opener[] = []
  let body = ''
  let inString = false
  let quote = ''
  let escaped = false
  let i = 0
  const n = text.length

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
        if (stack.length === 0) return { body, openStack: stack }
      }
      i++
      continue
    }

    if (ch === '"' || ch === "'") {
      inString = true
      quote = ch
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
      stack.push(ch)
      body += ch
      i++
      continue
    }
    if (ch === '}' || ch === ']') {
      if (stack.length === 0) {
        // A stray closer with nothing open above it: drop it and keep going.
        i++
        continue
      }
      stack.pop()
      body += ch
      i++
      if (stack.length === 0) return { body, openStack: stack }
      continue
    }

    body += ch
    i++
  }

  if (inString) body += quote
  return { body, openStack: stack }
}

/** Strips one dangling, incomplete trailing object member -- a trailing comma, a `"key":` with
 *  no value yet, or a bare `"key"` with no colon yet -- so the structure can close cleanly.
 *  Only applies inside an object (`{`); a trailing quoted string is a legitimate array element,
 *  not a dangling key. Returns null when nothing could be trimmed. */
function trimDanglingMember(body: string, inObjectContext: boolean): string | null {
  const trimmed = body.replace(/\s+$/, '')
  if (trimmed.endsWith(',')) return trimmed.slice(0, -1)
  if (!inObjectContext) return null

  const danglingKeyColon = trimmed.match(/,?\s*"(?:[^"\\]|\\.)*"\s*:\s*$/)
  if (danglingKeyColon) return trimmed.slice(0, danglingKeyColon.index)

  const danglingBareKey = trimmed.match(/,?\s*"(?:[^"\\]|\\.)*"\s*$/)
  if (danglingBareKey) return trimmed.slice(0, danglingBareKey.index)

  return null
}

/**
 * Best-effort repair for JSON that's close but not quite valid: unterminated strings/objects/
 * arrays, missing closing brackets, `//`/`\/* *\/` comments, decorative separator lines, a bare
 * object body missing its wrapping `{ }`, and leftover trailing data after the real value ends.
 * Returns the parsed value, or `undefined` if the text couldn't be salvaged -- callers should
 * fall back to something else (e.g. auto-detecting a different source format) rather than
 * treating that as a hard error.
 */
export function repairJson(rawText: string): JsonValue | undefined {
  const withoutBom = stripBom(rawText)
  if (withoutBom.trim() === '') return undefined

  const withoutDecorativeLines = withoutBom.replace(DECORATIVE_LINE, '')

  // A bare object body ("key": value, "key2": value2, ...) with no wrapping braces is a common
  // paste mistake -- e.g. copying an object's inner fields out of a bigger document or API
  // response viewer. Wrap it *before* the leading-prose skip below, which would otherwise mistake
  // the first member's own `:`/`[`/`{` for buried JSON and silently drop the leading key (and
  // everything after that member's own structure closes).
  const isBareObjectBody =
    BARE_OBJECT_MEMBER_START.test(withoutDecorativeLines) && !/^\s*[{[]/.test(withoutDecorativeLines)
  const source = isBareObjectBody ? `{${withoutDecorativeLines}}` : withoutDecorativeLines

  const bracketIndex = source.search(/[{[]/)
  const text = bracketIndex > 0 ? source.slice(bracketIndex) : source

  const { body, openStack } = scanStructure(text)
  let candidate = body

  for (let attempt = 0; attempt <= MAX_TRIM_ATTEMPTS; attempt++) {
    const closers = [...openStack].reverse().map(closerFor).join('')
    try {
      return JSON5.parse(candidate + closers) as JsonValue
    } catch {
      const inObjectContext = openStack.at(-1) === '{'
      const trimmed = trimDanglingMember(candidate, inObjectContext)
      if (trimmed === null || trimmed === candidate) return undefined
      candidate = trimmed
    }
  }
  return undefined
}
