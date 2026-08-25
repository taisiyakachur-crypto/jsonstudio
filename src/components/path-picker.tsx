import { Check, ChevronsUpDown } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useTranslation } from '@/i18n'
import type { PathEntry } from '@/lib/json-paths'
import { cn } from '@/lib/utils'

/** A searchable dropdown of every array/object path in a document, for picking a table or
 *  chart root. `paths` comes from `enumeratePaths` (see `lib/json-paths.ts`). */
export function PathPicker({
  paths,
  value,
  onChange,
  className,
}: {
  paths: PathEntry[]
  value: string
  onChange: (path: string) => void
  className?: string
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q === '') return paths
    return paths.filter((p) => p.pathLabel.toLowerCase().includes(q))
  }, [paths, query])

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          setQuery('')
          requestAnimationFrame(() => inputRef.current?.focus())
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex h-8 items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-xs shadow-sm hover:bg-accent',
            className,
          )}
        >
          <span className="truncate font-mono">{value || '$'}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('pathPicker.searchPlaceholder')}
          className="w-full border-b border-border bg-transparent px-3 py-2 text-sm outline-none"
        />
        <div className="max-h-72 overflow-y-auto p-1">
          {filtered.length === 0 && (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">{t('pathPicker.noMatches')}</p>
          )}
          {filtered.map((entry) => (
            <button
              key={entry.pathLabel}
              onClick={() => {
                onChange(entry.pathLabel)
                setOpen(false)
              }}
              className={cn(
                'flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-xs hover:bg-accent',
                entry.pathLabel === value && 'bg-accent',
              )}
            >
              <span className="flex min-w-0 items-center gap-1.5">
                {entry.pathLabel === value && <Check className="h-3 w-3 shrink-0" />}
                <span className="truncate font-mono">{entry.pathLabel}</span>
              </span>
              <span className="shrink-0 text-muted-foreground">
                {entry.type}
                {entry.childCount !== null ? ` · ${entry.childCount}` : ''}
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
