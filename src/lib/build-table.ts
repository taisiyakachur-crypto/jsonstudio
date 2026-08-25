import { collectColumns, detectColumnType, flattenRows, type FlatRow } from './flatten'
import type { ColumnMeta } from './table-query'
import { isJsonArray, isJsonObject, type JsonValue } from '@/types/json'
import type { JsonPathSegment } from '@/types/json-doc'

/** Resolves `path` within `root` down to the rows a table should show: the array at that path
 *  as-is, a single object wrapped as a one-row array, or `null` if the path points at a scalar
 *  or doesn't exist. */
export function resolveTableRows(root: JsonValue, path: JsonPathSegment[]): JsonValue[] | null {
  let current: JsonValue | undefined = root
  for (const segment of path) {
    if (current == null || typeof current !== 'object') return null
    current = isJsonArray(current) ? current[segment as number] : current[segment as string]
  }
  if (current === undefined) return null
  if (isJsonArray(current)) return current
  if (isJsonObject(current)) return [current]
  return null
}

export interface BuildTableResult {
  rows: FlatRow[]
  columns: ColumnMeta[]
  /** False when `path` didn't resolve to an array or object at all. */
  rootResolved: boolean
}

/** The full input-to-table pipeline: resolve the root path, flatten each row, and infer a
 *  type per column from its values. Pure and synchronous -- callers on a large document should
 *  run this inside a worker. */
export function buildTable(root: JsonValue, path: JsonPathSegment[], flattenDepth: number): BuildTableResult {
  const resolvedRows = resolveTableRows(root, path)
  if (resolvedRows === null) {
    return { rows: [], columns: [], rootResolved: false }
  }
  const rows = flattenRows(resolvedRows, flattenDepth)
  const columnKeys = collectColumns(rows)
  const columns: ColumnMeta[] = columnKeys.map((key) => ({
    key,
    type: detectColumnType(rows.map((row) => row[key])),
  }))
  return { rows, columns, rootResolved: true }
}
