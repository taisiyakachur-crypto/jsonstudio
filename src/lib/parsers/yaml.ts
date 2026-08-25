import { parse as parseYamlDocument } from 'yaml'
import { ParseInputError } from './errors'
import type { JsonValue } from '@/types/json'

export function parseYaml(text: string): JsonValue {
  try {
    const value = parseYamlDocument(text) as JsonValue
    if (value === undefined || value === null) {
      throw new ParseInputError('Порожній YAML-документ.')
    }
    return value
  } catch (err) {
    if (err instanceof ParseInputError) throw err
    const message = err instanceof Error ? err.message : String(err)
    throw new ParseInputError(`Некоректний YAML: ${message}`)
  }
}
