import { ArrowDown, ArrowUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { useTranslation } from '@/i18n'
import type { NWayRow } from '@/lib/diff-n-way'
import { cn } from '@/lib/utils'

type SortKey = 'path' | 'status'
type SortDir = 'asc' | 'desc'

const STATUS_BADGE: Record<'same' | 'differs', string> = {
  differs: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  same: 'bg-muted text-muted-foreground',
}

export function NWayTableView({
  rows,
  panelTitles,
  className,
}: {
  rows: NWayRow[]
  panelTitles: string[]
  className?: string
}) {
  const { t } = useTranslation()
  const [filter, setFilter] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('path')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const filtered = useMemo(() => {
    const query = filter.trim().toLowerCase()
    const base = query ? rows.filter((r) => r.pathLabel.toLowerCase().includes(query)) : rows
    return [...base].sort((a, b) => {
      const cmp =
        sortKey === 'path' ? a.pathLabel.localeCompare(b.pathLabel) : a.overallStatus.localeCompare(b.overallStatus)
      return sortDir === 'asc' ? cmp : -cmp
    })
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
              {panelTitles.map((title, i) => (
                <th key={i} className="max-w-[200px] px-3 py-2 font-medium">
                  {title}
                </th>
              ))}
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
                {row.previews.map((preview, i) => (
                  <td
                    key={i}
                    className={cn(
                      'max-w-[200px] truncate px-3 py-1.5 font-mono',
                      row.statuses[i] === 'same' ? 'text-muted-foreground' : 'text-foreground',
                    )}
                  >
                    {preview ?? '—'}
                  </td>
                ))}
                <td className="px-3 py-1.5">
                  <span className={cn('rounded px-1.5 py-0.5', STATUS_BADGE[row.overallStatus])}>
                    {row.overallStatus === 'differs' ? t('diffStatus.changed') : t('diffStatus.same')}
                  </span>
                </td>
                <td className="px-3 py-1.5 text-muted-foreground">
                  {row.changeKind ? t(`diffTable.changeKind.${row.changeKind}`) : '—'}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={panelTitles.length + 3} className="px-3 py-6 text-center text-muted-foreground">
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
