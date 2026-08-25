import { Filter, X } from 'lucide-react'
import { useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/i18n'
import type { ColumnMeta } from '@/lib/table-query'

/** Renders active per-column filters as removable chips, plus a Popover for adding one.
 *  Filters are matched as a case-insensitive substring (see `lib/table-query.ts`), so chips
 *  read as "column: value" rather than "column = value" to avoid implying an exact match. */
export function FilterChips({
  columns,
  filters,
  onFiltersChange,
}: {
  columns: ColumnMeta[]
  filters: Record<string, string>
  onFiltersChange: (filters: Record<string, string>) => void
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [column, setColumn] = useState<string>('')
  const [value, setValue] = useState('')

  function removeFilter(key: string) {
    const next = { ...filters }
    delete next[key]
    onFiltersChange(next)
  }

  function addFilter() {
    if (column === '' || value.trim() === '') return
    onFiltersChange({ ...filters, [column]: value })
    setColumn('')
    setValue('')
    setOpen(false)
  }

  return (
    <>
      {Object.entries(filters).map(([key, val]) => (
        <span
          key={key}
          className="flex h-[34px] shrink-0 items-center gap-2 rounded-lg bg-secondary px-2.5 text-xs font-medium text-secondary-foreground"
        >
          <span className="max-w-[180px] truncate font-mono">
            {key}: {val}
          </span>
          <button onClick={() => removeFilter(key)} className="text-secondary-foreground/70 hover:text-secondary-foreground">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (next) {
            setColumn(columns[0]?.key ?? '')
            setValue('')
          }
        }}
      >
        <PopoverTrigger asChild>
          <button className="flex h-[34px] shrink-0 items-center gap-1.5 rounded-lg border border-dashed border-border px-2.5 text-xs text-muted-foreground hover:bg-accent">
            <Filter className="h-3 w-3" />
            {t('table.filters.add')}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-3">
          <div className="flex flex-col gap-2.5">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">{t('table.filters.column')}</label>
              <Select value={column} onValueChange={setColumn}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((c) => (
                    <SelectItem key={c.key} value={c.key}>
                      {c.key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">{t('table.filters.value')}</label>
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addFilter()}
                className="h-8 text-xs"
                autoFocus
              />
            </div>
            <Button size="sm" className="rounded-lg" onClick={addFilter} disabled={column === '' || value.trim() === ''}>
              {t('table.filters.apply')}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}
