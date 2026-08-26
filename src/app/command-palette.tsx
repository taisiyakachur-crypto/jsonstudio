import { BarChart3, FileJson, GitCompare, Plus, Search, Table2, Wand2 } from 'lucide-react'
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

/** Tabs beyond the 9th don't get a ⌘-digit shortcut (matches `useGlobalHotkeys`, and
 *  browser-tab convention generally). */
const MAX_HOTKEY_TABS = 9

interface Entry {
  key: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  shortcut?: string
  run: () => void
}

interface Group {
  label: string
  entries: Entry[]
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

  const groups = useMemo<Group[]>(() => {
    const goToEntries: Entry[] = tabs.map((tab: AnyTab, i) => ({
      key: `tab:${tab.id}`,
      label: tab.title,
      icon: TOOL_ICONS[tab.type],
      shortcut: i < MAX_HOTKEY_TABS ? `⌘${i + 1}` : undefined,
      run: () => setActiveTab(tab.id),
    }))
    const actionEntries: Entry[] = (['format', 'compare', 'parse', 'table', 'chart'] as ToolType[]).map(
      (type) => ({
        key: `new:${type}`,
        label: `${t('tabs.new')}: ${t(`tabs.newTool.${type}`)}`,
        icon: Plus,
        // Cmd+T always opens a Format tab (see useGlobalHotkeys) -- only that entry has a real shortcut.
        shortcut: type === 'format' ? '⌘T' : undefined,
        run: () => addTab(type),
      }),
    )

    const all: Group[] = [
      { label: t('commandPalette.group.actions'), entries: actionEntries },
      { label: t('commandPalette.group.goTo'), entries: goToEntries },
    ]
    if (!query.trim()) return all

    const q = query.toLowerCase()
    return all
      .map((g) => ({ ...g, entries: g.entries.filter((e) => e.label.toLowerCase().includes(q)) }))
      .filter((g) => g.entries.length > 0)
  }, [tabs, query, setActiveTab, addTab, t])

  const flatEntries = useMemo(() => groups.flatMap((g) => g.entries), [groups])

  function commit(entry?: Entry) {
    const chosen = entry ?? flatEntries[highlighted]
    if (!chosen) return
    chosen.run()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="top-[14%] max-w-xl translate-y-0 rounded-2xl border-border bg-popover p-0 shadow-2xl">
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
          <Search className="h-[17px] w-[17px] shrink-0 text-muted-foreground" />
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
                setHighlighted((h) => Math.min(h + 1, flatEntries.length - 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setHighlighted((h) => Math.max(h - 1, 0))
              } else if (e.key === 'Enter') {
                e.preventDefault()
                commit()
              }
            }}
            placeholder={t('commandPalette.placeholder')}
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
          />
          <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
            ESC
          </span>
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
          {groups.map((group) => (
            <div key={group.label} className="mb-1 last:mb-0">
              <p className="mx-2 mb-1.5 mt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 first:mt-1.5">
                {group.label}
              </p>
              {group.entries.map((entry) => {
                const Icon = entry.icon
                const i = flatEntries.indexOf(entry)
                return (
                  <button
                    key={entry.key}
                    onClick={() => commit(entry)}
                    onMouseEnter={() => setHighlighted(i)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm',
                      i === highlighted && 'bg-secondary text-secondary-foreground',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{entry.label}</span>
                    {entry.shortcut && (
                      <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{entry.shortcut}</span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
          {flatEntries.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">—</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
