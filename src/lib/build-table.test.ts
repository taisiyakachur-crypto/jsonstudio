import { describe, expect, it } from 'vitest'
import { buildTable, resolveTableRows } from './build-table'

describe('resolveTableRows', () => {
  it('returns an array found at the root', () => {
    const rows = [{ a: 1 }, { a: 2 }]
    expect(resolveTableRows(rows, [])).toBe(rows)
  })

  it('resolves a nested path down to an array', () => {
    const doc = { data: { items: [{ a: 1 }] } }
    expect(resolveTableRows(doc, ['data', 'items'])).toEqual([{ a: 1 }])
  })

  it('wraps a single object as a one-row array', () => {
    expect(resolveTableRows({ a: 1, b: 2 }, [])).toEqual([{ a: 1, b: 2 }])
  })

  it('returns null for a path resolving to a scalar', () => {
    expect(resolveTableRows({ a: 1 }, ['a'])).toBeNull()
  })

  it('returns null for a path that does not exist', () => {
    expect(resolveTableRows({ a: 1 }, ['missing'])).toBeNull()
  })

  it('navigates through array indices too', () => {
    const doc = { items: [{ nested: [{ x: 1 }, { x: 2 }] }] }
    expect(resolveTableRows(doc, ['items', 0, 'nested'])).toEqual([{ x: 1 }, { x: 2 }])
  })
})

describe('buildTable', () => {
  it('builds rows and infers column types', () => {
    const doc = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ]
    const result = buildTable(doc, [], 5)
    expect(result.rootResolved).toBe(true)
    expect(result.rows).toEqual(doc)
    expect(result.columns).toEqual([
      { key: 'name', type: 'string' },
      { key: 'age', type: 'number' },
    ])
  })

  it('flattens nested objects into columns per the given depth', () => {
    const doc = [{ id: 1, address: { city: 'Kyiv' } }]
    const result = buildTable(doc, [], 5)
    expect(result.columns.map((c) => c.key)).toEqual(['id', 'address.city'])
  })

  it('reports rootResolved false when the path does not resolve', () => {
    const result = buildTable({ a: 1 }, ['nope'], 5)
    expect(result).toEqual({ rows: [], columns: [], rootResolved: false })
  })

  it('resolves a nested root path before building the table', () => {
    const doc = { data: { items: [{ x: 1 }, { x: 2 }] } }
    const result = buildTable(doc, ['data', 'items'], 5)
    expect(result.rows).toEqual([{ x: 1 }, { x: 2 }])
  })
})
