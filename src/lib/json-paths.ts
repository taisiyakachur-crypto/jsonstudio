import { formatJsonPath } from './json-path'
import { isJsonArray, isJsonObject, jsonNodeType, type JsonNodeType, type JsonValue } from '@/types/json'
import type { JsonPathSegment } from '@/types/json-doc'

export interface PathEntry {
  path: JsonPathSegment[]
  pathLabel: string
  type: JsonNodeType
  /** Number of keys/items directly under this path, for containers. */
  childCount: number | null
}

const DEFAULT_MAX_DEPTH = 6
const DEFAULT_MAX_COUNT = 2000
/** Large arrays only get their first few elements expanded -- enough to show the shape,
 *  without walking (say) 100,000 array-index paths nobody would pick as a table root anyway. */
const MAX_ARRAY_ITEMS_TO_EXPAND = 20

/**
 * Enumerates every object/array path in a document (including the root, `$`), for `PathPicker`.
 * Capped by depth and total count so a pathological document can't make this run away --
 * this only has to offer good candidates, not a complete index.
 */
export function enumeratePaths(
  root: JsonValue,
  options: { maxDepth?: number; maxCount?: number } = {},
): PathEntry[] {
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH
  const maxCount = options.maxCount ?? DEFAULT_MAX_COUNT
  const entries: PathEntry[] = []

  function visit(value: JsonValue, path: JsonPathSegment[], depth: number): void {
    if (entries.length >= maxCount) return
    const type = jsonNodeType(value)
    if (type !== 'object' && type !== 'array') return

    const childCount = isJsonArray(value) ? value.length : Object.keys(value as object).length
    entries.push({ path, pathLabel: formatJsonPath(path), type, childCount })

    if (depth >= maxDepth) return
    if (isJsonArray(value)) {
      const limit = Math.min(value.length, MAX_ARRAY_ITEMS_TO_EXPAND)
      for (let i = 0; i < limit && entries.length < maxCount; i++) {
        visit(value[i] as JsonValue, [...path, i], depth + 1)
      }
    } else if (isJsonObject(value)) {
      for (const key of Object.keys(value)) {
        if (entries.length >= maxCount) break
        visit(value[key] as JsonValue, [...path, key], depth + 1)
      }
    }
  }

  visit(root, [], 0)
  return entries
}
