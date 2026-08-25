import { isJsonObject, type JsonValue } from '@/types/json'

export type ColumnType = 'string' | 'number' | 'boolean' | 'date' | 'object' | 'null' | 'mixed'

export type FlatRow = Record<string, JsonValue>

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/

/**
 * Flattens one row's nested *objects* into dot-notation keys, up to `maxDepth` dot-joins.
 * `maxDepth = 0` means "just the top-level keys, no flattening at all" -- a nested object one
 * level down still becomes its own column, it just holds the sub-object as-is. Arrays are never
 * flattened (spec: flatten targets nested objects), staying a single cell value like an object
 * past `maxDepth` does.
 */
export function flattenRow(row: JsonValue, maxDepth: number): FlatRow {
  const out: FlatRow = {}

  function expand(value: JsonValue, prefix: string, dotsUsed: number): void {
    if (isJsonObject(value) && dotsUsed < maxDepth) {
      const keys = Object.keys(value)
      if (keys.length === 0) {
        out[prefix] = value
        return
      }
      for (const key of keys) {
        expand(value[key] as JsonValue, `${prefix}.${key}`, dotsUsed + 1)
      }
      return
    }
    out[prefix] = value
  }

  if (isJsonObject(row)) {
    // Top-level keys are always enumerated as columns -- that part isn't "flattening" yet, just
    // listing what the columns are. `dotsUsed` starts at 0 for whatever *they* might contain.
    for (const key of Object.keys(row)) {
      expand(row[key] as JsonValue, key, 0)
    }
  } else {
    out.value = row
  }
  return out
}

export function flattenRows(rows: JsonValue[], maxDepth: number): FlatRow[] {
  return rows.map((row) => flattenRow(row, maxDepth))
}

/** Union of keys across all rows, in first-seen order (stable column ordering). */
export function collectColumns(rows: FlatRow[]): string[] {
  const seen = new Set<string>()
  for (const row of rows) {
    for (const key of Object.keys(row)) seen.add(key)
  }
  return [...seen]
}

function scalarType(value: JsonValue): ColumnType {
  if (value === null) return 'null'
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'string') return ISO_DATE_RE.test(value) ? 'date' : 'string'
  return 'object' // plain object or array that survived flattening (depth cap, or an array)
}

/** Infers a column's type from a sample of its values: unanimous non-null type wins, a mix of
 *  types (ignoring null) is `'mixed'`, and an all-null column is `'null'`. */
export function detectColumnType(values: JsonValue[], sampleSize = 200): ColumnType {
  let seenType: ColumnType | null = null
  let sampled = 0
  for (const value of values) {
    if (sampled >= sampleSize) break
    if (value === undefined) continue
    sampled++
    const type = scalarType(value)
    if (type === 'null') continue
    if (seenType === null) seenType = type
    else if (seenType !== type) return 'mixed'
  }
  return seenType ?? 'null'
}
