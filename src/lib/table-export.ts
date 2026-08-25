import type { ColumnMeta } from './table-query'
import type { FlatRow } from './flatten'
import { previewJsonValue } from './json-preview'
import { isJsonArray, isJsonObject } from '@/types/json'

function cellText(row: FlatRow, key: string): string {
  const value = row[key]
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value
  if (isJsonObject(value) || isJsonArray(value)) return previewJsonValue(value)
  return String(value)
}

function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

/** Exports only the visible `columns`, in order, over the given (already filtered) `rows`. */
export function rowsToCsv(columns: ColumnMeta[], rows: FlatRow[]): string {
  const lines = [columns.map((c) => escapeCsvCell(c.key)).join(',')]
  for (const row of rows) {
    lines.push(columns.map((c) => escapeCsvCell(cellText(row, c.key))).join(','))
  }
  return lines.join('\r\n')
}

export function rowsToMarkdown(columns: ColumnMeta[], rows: FlatRow[]): string {
  const headers = columns.map((c) => c.key)
  const lines = [
    `| ${headers.map(escapeMarkdownCell).join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
  ]
  for (const row of rows) {
    lines.push(`| ${columns.map((c) => escapeMarkdownCell(cellText(row, c.key))).join(' | ')} |`)
  }
  return lines.join('\n')
}

/** Re-shapes each row down to just the visible columns, preserving original (non-stringified) values. */
export function rowsToJson(columns: ColumnMeta[], rows: FlatRow[]): string {
  const shaped = rows.map((row) => {
    const out: FlatRow = {}
    for (const c of columns) out[c.key] = row[c.key] ?? null
    return out
  })
  return JSON.stringify(shaped, null, 2)
}

/** Row data shaped for `xlsx`'s `json_to_sheet`, keyed by visible column, in column order. */
export function rowsToSheetData(columns: ColumnMeta[], rows: FlatRow[]): Record<string, string | number | boolean>[] {
  return rows.map((row) => {
    const out: Record<string, string | number | boolean> = {}
    for (const c of columns) {
      const value = row[c.key]
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        out[c.key] = value
      } else {
        out[c.key] = cellText(row, c.key)
      }
    }
    return out
  })
}
