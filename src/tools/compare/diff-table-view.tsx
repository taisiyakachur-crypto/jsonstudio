import { ArrowDown, ArrowUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { useTranslation } from '@/i18n'
import type { DiffStatus, DiffTableRow } from '@/lib/diff'
import { cn } from '@/lib/utils'

type SortKey = 'path' | 'status'
type SortDir = 'asc' | 'desc'

const STATUS_BADGE: Record<DiffStatus, string> = {
  added: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  removed: 'bg-rose-500/15 text-rose-700 dark:text-rose-400',
  changed: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  same: 'bg-muted text-muted-foreground',
}

export function DiffTableView({ rows, className }: { rows: DiffTableRow[]; className?: string }) {
  const { t } = useTranslation()
  const [filter, setFilter] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('path')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const filtered = useMemo(() => {
    const query = filter.trim().toLowerCase()
    const base = query ? rows.filter((r) => r.pathLabel.toLowerCase().includes(query)) : rows
    const sorted = [...base].sort((a, b) => {
      const cmp = sortKey === 'path' ? a.pathLabel.localeCompare(b.pathLabel) : a.status.localeCompare(b.status)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [rows, filter, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) return null
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
  }

  return (
    <div className={cn('flex flex-col overflow-hidden', className)}>
      <div className="shrink-0 border-b border-border p-2">
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={t('diffTable.filterPlaceholder')}
          className="h-8 max-w-xs text-xs"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 bg-background">
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-3 py-2 font-medium">
                <button className="flex items-center gap-1" onClick={() => toggleSort('path')}>
                  {t('diffTable.path')} <SortIcon column="path" />
                </button>
              </th>
              <th className="px-3 py-2 font-medium">JSON 1</th>
              <th className="px-3 py-2 font-medium">JSON 2</th>
              <th className="px-3 py-2 font-medium">
                <button className="flex items-center gap-1" onClick={() => toggleSort('status')}>
                  {t('diffTable.status')} <SortIcon column="status" />
                </button>
              </th>
              <th className="px-3 py-2 font-medium">{t('diffTable.changeKind')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={JSON.stringify(row.path)} className="border-b border-border/60">
                <td className="px-3 py-1.5 font-mono">{row.pathLabel}</td>
                <td className="max-w-[240px] truncate px-3 py-1.5 font-mono text-rose-600 dark:text-rose-400">
                  {row.leftPreview ?? '—'}
                </td>
                <td className="max-w-[240px] truncate px-3 py-1.5 font-mono text-emerald-600 dark:text-emerald-400">
                  {row.rightPreview ?? '—'}
                </td>
                <td className="px-3 py-1.5">
                  <span className={cn('rounded px-1.5 py-0.5', STATUS_BADGE[row.status])}>
                    {t(`diffStatus.${row.status}`)}
                  </span>
                </td>
                <td className="px-3 py-1.5 text-muted-foreground">
                  {row.changeKind ? t(`diffTable.changeKind.${row.changeKind}`) : '—'}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  {t('diffTable.noRows')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
