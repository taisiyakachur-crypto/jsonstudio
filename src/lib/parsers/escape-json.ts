import type { JsonValue } from '@/types/json'

/** The reverse of `parseEscapedJsonString`: turns a JSON value into a quoted, escaped string
 *  literal ready to paste into a test case, ticket, or another JSON document as a string field. */
export function escapeJsonToString(value: JsonValue, indent: number | string = 0): string {
  return JSON.stringify(JSON.stringify(value, null, indent))
}
