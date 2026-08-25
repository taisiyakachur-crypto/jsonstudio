import Ajv from 'ajv'
import type { JsonValue } from '@/types/json'

export type SchemaValidationOutcome =
  | { status: 'schema-error'; message: string }
  | { status: 'valid' }
  | { status: 'invalid'; errors: string[] }

/** Validates `document` against a user-supplied JSON Schema (given as raw text) using ajv. */
export function validateAgainstSchema(document: JsonValue, schemaText: string): SchemaValidationOutcome {
  let schema: unknown
  try {
    schema = JSON.parse(schemaText)
  } catch (err) {
    return { status: 'schema-error', message: err instanceof Error ? err.message : String(err) }
  }

  const ajv = new Ajv({ allErrors: true, strict: false })
  let validateFn
  try {
    validateFn = ajv.compile(schema as object)
  } catch (err) {
    return { status: 'schema-error', message: err instanceof Error ? err.message : String(err) }
  }

  const valid = validateFn(document)
  if (valid) return { status: 'valid' }

  const errors = (validateFn.errors ?? []).map((e) => `${e.instancePath === '' ? '/' : e.instancePath} ${e.message ?? ''}`.trim())
  return { status: 'invalid', errors }
}
