import { describe, expect, it } from 'vitest'
import { exportDiffToCsv, exportDiffToMarkdown, type ExportableDiffRow } from './diff-export'

const rows: ExportableDiffRow[] = [
  { pathLabel: '$.a', values: ['1', '2'], status: 'differs', changeKind: 'value' },
  { pathLabel: '$.b|c', values: ['x', null], status: 'differs', changeKind: null },
]

describe('exportDiffToMarkdown', () => {
  it('produces a header row, a separator row, and one row per diff entry', () => {
    const md = exportDiffToMarkdown(rows, ['Prod', 'Stage'])
    const lines = md.split('\n')
    expect(lines[0]).toBe('| Шлях | Prod | Stage | Статус | Тип змін |')
    expect(lines[1]).toBe('| --- | --- | --- | --- | --- |')
    expect(lines).toHaveLength(4)
  })

  it('escapes pipe characters so the table does not break', () => {
    const md = exportDiffToMarkdown(rows, ['Prod', 'Stage'])
    expect(md).toContain('$.b\\|c')
  })

  it('renders a missing value as an em dash', () => {
    const md = exportDiffToMarkdown(rows, ['Prod', 'Stage'])
    expect(md).toContain('| — |')
  })
})

describe('exportDiffToCsv', () => {
  it('produces a CSV header and one line per row', () => {
    const csv = exportDiffToCsv(rows, ['Prod', 'Stage'])
    const lines = csv.split('\r\n')
    expect(lines[0]).toBe('Path,Prod,Stage,Status,Change kind')
    expect(lines).toHaveLength(3)
  })

  it('quotes cells containing commas or quotes', () => {
    const csv = exportDiffToCsv(
      [{ pathLabel: '$.x', values: ['a,b', '"quoted"'], status: 'differs', changeKind: 'value' }],
      ['A', 'B'],
    )
    expect(csv).toContain('"a,b"')
    expect(csv).toContain('"""quoted"""')
  })
})
