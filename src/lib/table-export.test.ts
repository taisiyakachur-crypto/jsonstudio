import { describe, expect, it } from 'vitest'
import { rowsToCsv, rowsToJson, rowsToMarkdown, rowsToSheetData } from './table-export'
import type { ColumnMeta } from './table-query'

const columns: ColumnMeta[] = [
  { key: 'name', type: 'string' },
  { key: 'age', type: 'number' },
  { key: 'meta', type: 'object' },
]

const rows = [
  { name: 'Olena', age: 30, meta: { vip: true } },
  { name: 'a, "b"', age: null, meta: [1, 2] },
]

describe('rowsToCsv', () => {
  it('writes a header row and escapes commas/quotes', () => {
    const csv = rowsToCsv(columns, rows)
    const lines = csv.split('\r\n')
    expect(lines[0]).toBe('name,age,meta')
    expect(lines[1]).toBe('Olena,30,{1}')
    expect(lines[2]).toBe('"a, ""b""",,[2]')
  })

  it('only includes the given (visible) columns', () => {
    const csv = rowsToCsv([columns[0]], rows)
    expect(csv.split('\r\n')[0]).toBe('name')
  })
})

describe('rowsToMarkdown', () => {
  it('writes a pipe table with a separator row', () => {
    const md = rowsToMarkdown(columns, rows)
    const lines = md.split('\n')
    expect(lines[0]).toBe('| name | age | meta |')
    expect(lines[1]).toBe('| --- | --- | --- |')
    expect(lines[2]).toBe('| Olena | 30 | {1} |')
  })
})

describe('rowsToJson', () => {
  it('keeps only visible columns, with original (non-stringified) values', () => {
    const json = JSON.parse(rowsToJson(columns, rows)) as unknown[]
    expect(json).toEqual([
      { name: 'Olena', age: 30, meta: { vip: true } },
      { name: 'a, "b"', age: null, meta: [1, 2] },
    ])
  })
})

describe('rowsToSheetData', () => {
  it('keeps scalars as-is and stringifies containers', () => {
    const data = rowsToSheetData(columns, rows)
    expect(data[0]).toEqual({ name: 'Olena', age: 30, meta: '{1}' })
    expect(data[1]).toEqual({ name: 'a, "b"', age: '', meta: '[2]' })
  })
})
