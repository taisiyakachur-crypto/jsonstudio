import { ParseInputError } from './errors'
import type { JsonValue } from '@/types/json'

const MAX_UNESCAPE_DEPTH = 10

/**
 * Parses a JSON string that is itself wrapped (possibly several times over) in JSON string
 * escaping, e.g. `"{\"id\":1}"`, or even `"\"{\\\"id\\\":1}\""`. Each layer is unwrapped by
 * parsing it as JSON; unwrapping stops once the result is no longer a re-parseable string.
 */
export function parseEscapedJsonString(text: string): JsonValue {
  const trimmed = text.trim()
  let current: JsonValue
  try {
    current = JSON.parse(trimmed) as JsonValue
  } catch {
    throw new ParseInputError('Текст не є дійсним JSON-рядком (очікувались лапки й екранування).')
  }

  let depth = 0
  while (typeof current === 'string' && depth < MAX_UNESCAPE_DEPTH) {
    try {
      current = JSON.parse(current) as JsonValue
    } catch {
      break
    }
    depth++
  }
  return current
}
