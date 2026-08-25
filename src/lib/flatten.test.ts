import { describe, expect, it } from 'vitest'
import { collectColumns, detectColumnType, flattenRow, flattenRows } from './flatten'

describe('flattenRow', () => {
  it('leaves a flat object untouched', () => {
    expect(flattenRow({ a: 1, b: 'x' }, 5)).toEqual({ a: 1, b: 'x' })
  })

  it('flattens nested objects into dot-notation keys', () => {
    expect(flattenRow({ id: 1, address: { city: 'Kyiv', zip: '01001' } }, 5)).toEqual({
      id: 1,
      'address.city': 'Kyiv',
      'address.zip': '01001',
    })
  })

  it('flattens multiple levels deep', () => {
    expect(flattenRow({ a: { b: { c: 1 } } }, 5)).toEqual({ 'a.b.c': 1 })
  })

  it('stops flattening past maxDepth and keeps the sub-object as a cell value', () => {
    const row = { a: { b: { c: 1 } } }
    expect(flattenRow(row, 1)).toEqual({ 'a.b': { c: 1 } })
  })

  it('maxDepth 0 lists top-level keys only, with nested objects untouched', () => {
    expect(flattenRow({ a: { b: 1 }, c: 2 }, 0)).toEqual({ a: { b: 1 }, c: 2 })
  })

  it('never flattens arrays, even nested ones', () => {
    expect(flattenRow({ tags: ['a', 'b'] }, 5)).toEqual({ tags: ['a', 'b'] })
  })

  it('keeps an empty nested object as a cell value', () => {
    expect(flattenRow({ meta: {} }, 5)).toEqual({ meta: {} })
  })

  it('wraps a non-object row (e.g. a plain string array) under "value"', () => {
    expect(flattenRow('just a string', 5)).toEqual({ value: 'just a string' })
    expect(flattenRow(42, 5)).toEqual({ value: 42 })
  })
})

describe('flattenRows / collectColumns', () => {
  it('collects the union of columns across rows with uneven shapes, in first-seen order', () => {
    const rows = flattenRows([{ a: 1, b: 2 }, { a: 1, c: 3 }], 5)
    expect(collectColumns(rows)).toEqual(['a', 'b', 'c'])
  })
})

describe('detectColumnType', () => {
  it('detects number, string, boolean columns', () => {
    expect(detectColumnType([1, 2, 3])).toBe('number')
    expect(detectColumnType(['a', 'b'])).toBe('string')
    expect(detectColumnType([true, false])).toBe('boolean')
  })

  it('detects ISO date strings', () => {
    expect(detectColumnType(['2026-01-01', '2026-02-15T10:30:00Z'])).toBe('date')
  })

  it('detects object/array columns', () => {
    expect(detectColumnType([{ a: 1 }, { b: 2 }])).toBe('object')
    expect(detectColumnType([[1, 2], [3]])).toBe('object')
  })

  it('ignores nulls when determining the dominant type', () => {
    expect(detectColumnType([1, null, 2, null])).toBe('number')
  })

  it('reports null for an all-null column', () => {
    expect(detectColumnType([null, null])).toBe('null')
  })

  it('reports mixed for genuinely mixed types', () => {
    expect(detectColumnType([1, 'two', 3])).toBe('mixed')
  })

  it('only samples the first N values for performance', () => {
    const values = [...Array(200).fill(1), 'a string outlier']
    expect(detectColumnType(values, 200)).toBe('number')
  })
})
