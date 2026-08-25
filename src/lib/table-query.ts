import type { ColumnType, FlatRow } from './flatten'
import { previewJsonValue } from './json-preview'
import { isJsonArray, isJsonObject } from '@/types/json'

export interface ColumnMeta {
  key: string
  type: ColumnType
}

/** Merges a user's persisted column order with the document's actual columns: known columns
 *  keep their persisted position, and any new columns (e.g. after a root/depth change) are
 *  appended at the end. Columns no longer present are dropped. */
export function resolveColumnOrder(columns: ColumnMeta[], persistedOrder: string[]): string[] {
  const knownKeys = new Set(columns.map((c) => c.key))
  const known = new Set(persistedOrder)
  return [
    ...persistedOrder.filter((k) => knownKeys.has(k)),
    ...columns.map((c) => c.key).filter((k) => !known.has(k)),
  ]
}

export interface TableQuery {
  sortColumn: string | null
  sortDir: 'asc' | 'desc'
  /** Matched as a case-insensitive substring against every cell in the row. */
  search: string
  /** Per-column case-insensitive substring filters. */
  columnFilters: Record<string, string>
  offset: number
  limit: number
}

export const DEFAULT_TABLE_QUERY: TableQuery = {
  sortColumn: null,
  sortDir: 'asc',
  search: '',
  columnFilters: {},
  offset: 0,
  limit: 100,
}

export interface TableQueryResult {
  rows: FlatRow[]
  /** Row count after filtering, before pagination -- what the UI paginates/virtualizes over. */
  totalFiltered: number
}

function cellText(row: FlatRow, key: string): string {
  const value = row[key]
  if (value === undefined) return ''
  if (typeof value === 'string') return value
  if (isJsonObject(value) || isJsonArray(value)) return previewJsonValue(value)
  return String(value)
}

function rowMatches(row: FlatRow, query: TableQuery): boolean {
  for (const [column, filterText] of Object.entries(query.columnFilters)) {
    if (filterText.trim() === '') continue
    if (!cellText(row, column).toLowerCase().includes(filterText.toLowerCase())) return false
  }
  if (query.search.trim() !== '') {
    const needle = query.search.toLowerCase()
    const matchesAny = Object.keys(row).some((key) => cellText(row, key).toLowerCase().includes(needle))
    if (!matchesAny) return false
  }
  return true
}

function compareValues(a: FlatRow, b: FlatRow, column: string): number {
  const av = a[column]
  const bv = b[column]
  const aMissing = av === undefined || av === null
  const bMissing = bv === undefined || bv === null
  if (aMissing && bMissing) return 0
  if (aMissing) return -1
  if (bMissing) return 1
  if (typeof av === 'number' && typeof bv === 'number') return av - bv
  if (typeof av === 'boolean' && typeof bv === 'boolean') return Number(av) - Number(bv)
  return cellText(a, column).localeCompare(cellText(b, column))
}

/** Filters, sorts and paginates already-flattened rows. Pure and synchronous -- the worker
 *  wrapper is what makes this non-blocking for large tables, not this function itself. */
export function queryTable(rows: FlatRow[], query: TableQuery): TableQueryResult {
  const filtered =
    query.search.trim() === '' && Object.keys(query.columnFilters).length === 0
      ? rows
      : rows.filter((row) => rowMatches(row, query))

  const sorted = query.sortColumn
    ? [...filtered].sort((a, b) => {
        const cmp = compareValues(a, b, query.sortColumn!)
        return query.sortDir === 'asc' ? cmp : -cmp
      })
    : filtered

  return {
    rows: sorted.slice(query.offset, query.offset + query.limit),
    totalFiltered: sorted.length,
  }
}
