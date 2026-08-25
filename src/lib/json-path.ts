import type { JsonPathSegment } from '@/types/json-doc'

const VALID_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/
const IDENTIFIER_CHAR = /[A-Za-z0-9_$]/
const DIGIT = /[0-9]/

/** Renders a path as a `$.user.orders[0].id`-style JSONPath string. */
export function formatJsonPath(path: JsonPathSegment[]): string {
  let out = '$'
  for (const segment of path) {
    if (typeof segment === 'number') {
      out += `[${segment}]`
    } else if (VALID_IDENTIFIER.test(segment)) {
      out += `.${segment}`
    } else {
      out += `[${JSON.stringify(segment)}]`
    }
  }
  return out
}

/** Parses a `formatJsonPath`-style string back into segments. Returns `null` on malformed input. */
export function parseJsonPath(input: string): JsonPathSegment[] | null {
  const trimmed = input.trim()
  if (trimmed[0] !== '$') return null
  const segments: JsonPathSegment[] = []
  let i = 1
  while (i < trimmed.length) {
    const ch = trimmed[i]
    if (ch === '.') {
      i++
      const start = i
      while (i < trimmed.length && IDENTIFIER_CHAR.test(trimmed[i])) i++
      if (i === start) return null
      segments.push(trimmed.slice(start, i))
    } else if (ch === '[') {
      i++
      if (trimmed[i] === '"') {
        const start = i
        i++
        while (i < trimmed.length && trimmed[i] !== '"') {
          if (trimmed[i] === '\\') i++
          i++
        }
        if (trimmed[i] !== '"') return null
        const raw = trimmed.slice(start, i + 1)
        i++
        if (trimmed[i] !== ']') return null
        i++
        try {
          segments.push(JSON.parse(raw) as string)
        } catch {
          return null
        }
      } else {
        const start = i
        while (i < trimmed.length && DIGIT.test(trimmed[i])) i++
        if (i === start || trimmed[i] !== ']') return null
        segments.push(Number(trimmed.slice(start, i)))
        i++
      }
    } else {
      return null
    }
  }
  return segments
}
