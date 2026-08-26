import { Columns3 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useTranslation } from '@/i18n'
import type { ColumnMeta } from '@/lib/table-query'

export function ColumnManager({
  columns,
  hiddenColumns,
  onHiddenColumnsChange,
  pinFirstColumn,
  onPinFirstColumnChange,
}: {
  columns: ColumnMeta[]
  hiddenColumns: string[]
  onHiddenColumnsChange: (hidden: string[]) => void
  pinFirstColumn: boolean
  onPinFirstColumnChange: (pinned: boolean) => void
}) {
  const { t } = useTranslation()
  const hiddenSet = new Set(hiddenColumns)
  const visibleCount = columns.length - hiddenSet.size

  function toggleColumn(key: string, visible: boolean) {
    onHiddenColumnsChange(visible ? hiddenColumns.filter((k) => k !== key) : [...hiddenColumns, key])
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex h-[34px] shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium hover:bg-accent">
          <Columns3 className="h-3.5 w-3.5" />
          {t('table.columns')} · {visibleCount}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2">
        <label className="flex items-center gap-2 rounded-sm px-1.5 py-1.5 text-sm hover:bg-accent">
          <Checkbox checked={pinFirstColumn} onCheckedChange={(v) => onPinFirstColumnChange(v === true)} />
          {t('table.pinFirstColumn')}
        </label>
        <div className="my-1 h-px bg-border" />
        <div className="max-h-72 overflow-y-auto">
          {columns.map((col) => (
            <label
              key={col.key}
              className="flex items-center gap-2 rounded-sm px-1.5 py-1.5 text-sm hover:bg-accent"
            >
              <Checkbox
                checked={!hiddenSet.has(col.key)}
                onCheckedChange={(v) => toggleColumn(col.key, v === true)}
              />
              <span className="truncate font-mono text-xs">{col.key}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
