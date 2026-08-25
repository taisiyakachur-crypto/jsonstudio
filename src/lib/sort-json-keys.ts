import { isJsonArray, isJsonObject, type JsonValue } from '@/types/json'

/** Recursively sorts object keys A→Z. Array order is left untouched. */
export function sortJsonKeysDeep(value: JsonValue): JsonValue {
  if (isJsonArray(value)) {
    return value.map(sortJsonKeysDeep)
  }
  if (isJsonObject(value)) {
    const sorted: Record<string, JsonValue> = {}
    for (const key of Object.keys(value).sort((a, b) => a.localeCompare(b))) {
      sorted[key] = sortJsonKeysDeep(value[key] as JsonValue)
    }
    return sorted
  }
  return value
}
