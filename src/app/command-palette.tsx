import { BarChart3, FileJson, GitCompare, Plus, Table2, Wand2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useTranslation } from '@/i18n'
import { cn } from '@/lib/utils'
import { useTabsStore } from '@/store/tabs-store'
import type { AnyTab, ToolType } from '@/types/tabs'

const TOOL_ICONS: Record<ToolType, React.ComponentType<{ className?: string }>> = {
  compare: GitCompare,
  parse: FileJson,
  table: Table2,
  chart: BarChart3,
  format: Wand2,
}

interface Entry {
  key: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  run: () => void
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const tabs = useTabsStore((s) => s.tabs)
  const setActiveTab = useTabsStore((s) => s.setActiveTab)
  const addTab = useTabsStore((s) => s.addTab)
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setHighlighted(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const entries = useMemo<Entry[]>(() => {
    const tabEntries: Entry[] = tabs.map((tab: AnyTab) => ({
      key: `tab:${tab.id}`,
      label: tab.title,
      icon: TOOL_ICONS[tab.type],
      run: () => setActiveTab(tab.id),
    }))
    const newTabEntries: Entry[] = (['compare', 'parse', 'table', 'chart', 'format'] as ToolType[]).map(
      (type) => ({
        key: `new:${type}`,
        label: `${t('tabs.new')}: ${t(`tabs.newTool.${type}`)}`,
        icon: Plus,
        run: () => addTab(type),
      }),
    )
    const all = [...tabEntries, ...newTabEntries]
    if (!query.trim()) return all
    const q = query.toLowerCase()
    return all.filter((e) => e.label.toLowerCase().includes(q))
  }, [tabs, query, setActiveTab, addTab, t])

  function commit(entry?: Entry) {
    const chosen = entry ?? entries[highlighted]
    if (!chosen) return
    chosen.run()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="top-[20%] max-w-xl translate-y-0 p-0">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setHighlighted(0)
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setHighlighted((h) => Math.min(h + 1, entries.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setHighlighted((h) => Math.max(h - 1, 0))
            } else if (e.key === 'Enter') {
              e.preventDefault()
              commit()
            }
          }}
          placeholder={t('commandPalette.placeholder')}
          className="w-full border-b border-border bg-transparent px-4 py-3 text-sm outline-none"
        />
        <div className="max-h-80 overflow-y-auto p-1">
          {entries.map((entry, i) => {
            const Icon = entry.icon
            return (
              <button
                key={entry.key}
                onClick={() => commit(entry)}
                onMouseEnter={() => setHighlighted(i)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm',
                  i === highlighted ? 'bg-accent text-accent-foreground' : '',
                )}
              >
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                {entry.label}
              </button>
            )
          })}
          {entries.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">—</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
