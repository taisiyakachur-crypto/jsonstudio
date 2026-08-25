import { isJsonArray, isJsonObject, type JsonValue } from '@/types/json'

const MAX_STRING_PREVIEW_LENGTH = 120

/** A short, single-line rendering of a value: `{3}` for an object, `"a…"` for a long string, etc. */
export function previewJsonValue(value: JsonValue): string {
  if (isJsonArray(value)) return `[${value.length}]`
  if (isJsonObject(value)) return `{${Object.keys(value).length}}`
  if (typeof value === 'string') {
    const truncated =
      value.length > MAX_STRING_PREVIEW_LENGTH ? `${value.slice(0, MAX_STRING_PREVIEW_LENGTH)}…` : value
    return JSON.stringify(truncated)
  }
  return JSON.stringify(value)
}
