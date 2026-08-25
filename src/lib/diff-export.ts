import type { NWayRow } from './diff-n-way'

/**
 * A row shape decoupled from `NWayRow` so the export format doesn't have to change if the
 * in-memory diff representation does. `buildNWayRows` (see `diff-n-way.ts`) is used for exactly
 * 2 panels too, so this is the one row shape export needs regardless of panel count.
 */
export interface ExportableDiffRow {
  pathLabel: string
  values: (string | null)[]
  status: 'differs' | 'same'
  changeKind: 'value' | 'type' | null
}

export function nWayRowsToExportable(rows: NWayRow[]): ExportableDiffRow[] {
  return rows.map((r) => ({
    pathLabel: r.pathLabel,
    values: r.previews,
    status: r.overallStatus,
    changeKind: r.changeKind,
  }))
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

function cellText(value: string | null): string {
  return value ?? '—'
}

/** A Markdown table ready to paste into Jira/Confluence/GitHub. */
export function exportDiffToMarkdown(rows: ExportableDiffRow[], panelTitles: string[]): string {
  const headers = ['Шлях', ...panelTitles, 'Статус', 'Тип змін']
  const lines = [
    `| ${headers.map(escapeMarkdownCell).join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
  ]
  for (const row of rows) {
    const cells = [
      row.pathLabel,
      ...row.values.map((v) => cellText(v)),
      row.status,
      row.changeKind ?? '—',
    ]
    lines.push(`| ${cells.map((c) => escapeMarkdownCell(c)).join(' | ')} |`)
  }
  return lines.join('\n')
}

function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

export function exportDiffToCsv(rows: ExportableDiffRow[], panelTitles: string[]): string {
  const headers = ['Path', ...panelTitles, 'Status', 'Change kind']
  const lines = [headers.map(escapeCsvCell).join(',')]
  for (const row of rows) {
    const cells = [
      row.pathLabel,
      ...row.values.map((v) => cellText(v)),
      row.status,
      row.changeKind ?? '',
    ]
    lines.push(cells.map((c) => escapeCsvCell(c)).join(','))
  }
  return lines.join('\r\n')
}
