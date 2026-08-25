import { JSONPath } from 'jsonpath-plus'
import type { JsonValue } from '@/types/json'

export type JsonPathQueryResult =
  | { status: 'ok'; results: JsonValue[] }
  | { status: 'error'; message: string }

/** Evaluates a JSONPath expression (e.g. `$.store.book[*].author`) against `value`. */
export function queryJsonPath(value: JsonValue, expression: string): JsonPathQueryResult {
  if (expression.trim() === '') return { status: 'ok', results: [] }
  try {
    const results = JSONPath({ path: expression, json: value, wrap: true }) as JsonValue[]
    return { status: 'ok', results }
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err) }
  }
}
