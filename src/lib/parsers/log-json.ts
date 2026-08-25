import { ParseInputError } from './errors'
import type { JsonValue } from '@/types/json'

/** Finds the first `{`/`[` in `text` and its balanced closing bracket, respecting string
 *  literals (so a brace inside a quoted string doesn't throw off the count). */
function findBalancedSpan(text: string): { start: number; end: number } | null {
  const openIndex = text.search(/[{[]/)
  if (openIndex === -1) return null
  const open = text[openIndex]
  const close = open === '{' ? '}' : ']'

  let depth = 0
  let inString = false
  let escaped = false
  for (let i = openIndex; i < text.length; i++) {
    const ch = text[i]
    if (inString) {
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') inString = true
    else if (ch === open) depth++
    else if (ch === close) {
      depth--
      if (depth === 0) return { start: openIndex, end: i + 1 }
    }
  }
  return null
}

/** Extracts and parses the first balanced `{...}` or `[...]` span found anywhere in `text`,
 *  e.g. pulling the JSON payload out of a log line like `2026-01-01 INFO body: {"id":1} done`. */
export function parseJsonFromLogLine(text: string): JsonValue {
  const span = findBalancedSpan(text)
  if (!span) {
    throw new ParseInputError('У тексті не знайдено збалансованого об’єкта чи масиву JSON.')
  }
  const candidate = text.slice(span.start, span.end)
  try {
    return JSON.parse(candidate) as JsonValue
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new ParseInputError(`Знайдений фрагмент не є дійсним JSON: ${message}`)
  }
}
