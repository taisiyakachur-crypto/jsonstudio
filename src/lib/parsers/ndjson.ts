import { ParseInputError } from './errors'
import type { JsonValue } from '@/types/json'

/** Parses newline-delimited JSON (one JSON value per line) into an array. */
export function parseNdjson(text: string): JsonValue {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')
  if (lines.length === 0) {
    throw new ParseInputError('Порожній вміст.')
  }
  return lines.map((line, i) => {
    try {
      return JSON.parse(line) as JsonValue
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      throw new ParseInputError(`Рядок ${i + 1}: некоректний JSON (${message})`)
    }
  })
}
