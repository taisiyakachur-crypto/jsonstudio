import { describe, expect, it } from 'vitest'
import { DEFAULT_TABLE_QUERY, queryTable, resolveColumnOrder, type ColumnMeta } from './table-query'
import type { FlatRow } from './flatten'

const rows: FlatRow[] = [
  { name: 'Bob', age: 25, active: true },
  { name: 'Alice', age: 30, active: false },
  { name: 'Carl', age: null, active: true },
]

describe('resolveColumnOrder', () => {
  const columns: ColumnMeta[] = [
    { key: 'a', type: 'string' },
    { key: 'b', type: 'number' },
    { key: 'c', type: 'boolean' },
  ]

  it('keeps the persisted order for known columns', () => {
    expect(resolveColumnOrder(columns, ['c', 'a', 'b'])).toEqual(['c', 'a', 'b'])
  })

  it('appends new columns not yet in the persisted order', () => {
    expect(resolveColumnOrder(columns, ['b'])).toEqual(['b', 'a', 'c'])
  })

  it('drops columns no longer present in the document', () => {
    expect(resolveColumnOrder(columns, ['a', 'gone', 'b', 'c'])).toEqual(['a', 'b', 'c'])
  })

  it('returns document order when nothing is persisted yet', () => {
    expect(resolveColumnOrder(columns, [])).toEqual(['a', 'b', 'c'])
  })
})

describe('queryTable: pagination', () => {
  it('returns all rows within the limit and reports the total', () => {
    const result = queryTable(rows, DEFAULT_TABLE_QUERY)
    expect(result.rows).toHaveLength(3)
    expect(result.totalFiltered).toBe(3)
  })

  it('slices by offset/limit', () => {
    const result = queryTable(rows, { ...DEFAULT_TABLE_QUERY, offset: 1, limit: 1 })
    expect(result.rows).toEqual([rows[1]])
    expect(result.totalFiltered).toBe(3)
  })
})

describe('queryTable: sorting', () => {
  it('sorts numerically, ascending, with null sorting first', () => {
    const result = queryTable(rows, { ...DEFAULT_TABLE_QUERY, sortColumn: 'age', limit: 10 })
    expect(result.rows.map((r) => r.name)).toEqual(['Carl', 'Bob', 'Alice'])
  })

  it('sorts descending, with null treated as the smallest value so it now sorts last', () => {
    const result = queryTable(rows, {
      ...DEFAULT_TABLE_QUERY,
      sortColumn: 'age',
      sortDir: 'desc',
      limit: 10,
    })
    expect(result.rows.map((r) => r.name)).toEqual(['Alice', 'Bob', 'Carl'])
  })

  it('sorts strings alphabetically', () => {
    const result = queryTable(rows, { ...DEFAULT_TABLE_QUERY, sortColumn: 'name', limit: 10 })
    expect(result.rows.map((r) => r.name)).toEqual(['Alice', 'Bob', 'Carl'])
  })
})

describe('queryTable: filtering', () => {
  it('applies a per-column substring filter, case-insensitively', () => {
    const result = queryTable(rows, {
      ...DEFAULT_TABLE_QUERY,
      columnFilters: { name: 'ali' },
      limit: 10,
    })
    expect(result.rows.map((r) => r.name)).toEqual(['Alice'])
  })

  it('applies a global search across all columns', () => {
    const result = queryTable(rows, { ...DEFAULT_TABLE_QUERY, search: '30', limit: 10 })
    expect(result.rows.map((r) => r.name)).toEqual(['Alice'])
  })

  it('combines filter and search with AND semantics', () => {
    const result = queryTable(rows, {
      ...DEFAULT_TABLE_QUERY,
      search: 'true',
      columnFilters: { name: 'carl' },
      limit: 10,
    })
    expect(result.rows.map((r) => r.name)).toEqual(['Carl'])
  })

  it('reports zero rows when nothing matches', () => {
    const result = queryTable(rows, { ...DEFAULT_TABLE_QUERY, search: 'nobody', limit: 10 })
    expect(result.rows).toEqual([])
    expect(result.totalFiltered).toBe(0)
  })
})
