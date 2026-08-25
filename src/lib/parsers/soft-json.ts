import JSON5 from 'json5'
import { ParseInputError } from './errors'
import type { JsonValue } from '@/types/json'

/** Parses JSON5: comments, trailing commas, single-quoted strings, unquoted keys. */
export function parseSoftJson(text: string): JsonValue {
  try {
    return JSON5.parse(text) as JsonValue
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new ParseInputError(`Некоректний JSON5: ${message}`)
  }
}
