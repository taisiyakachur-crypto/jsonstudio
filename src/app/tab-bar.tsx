import { BarChart3, Copy, FileJson, GitCompare, MoreVertical, Table2, Wand2, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useTabsStore } from '@/store/tabs-store'
import type { AnyTab, ToolType } from '@/types/tabs'
import { useTranslation } from '@/i18n'
import { NewTabMenu } from './new-tab-menu'

const TOOL_ICONS: Record<ToolType, React.ComponentType<{ className?: string }>> = {
  compare: GitCompare,
  parse: FileJson,
  table: Table2,
  chart: BarChart3,
  format: Wand2,
}

function TabItem({ tab, active }: { tab: AnyTab; active: boolean }) {
  const { t } = useTranslation()
  const setActiveTab = useTabsStore((s) => s.setActiveTab)
  const closeTab = useTabsStore((s) => s.closeTab)
  const duplicateTab = useTabsStore((s) => s.duplicateTab)
  const renameTab = useTabsStore((s) => s.renameTab)
  const reorderTabs = useTabsStore((s) => s.reorderTabs)
  const tabs = useTabsStore((s) => s.tabs)

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(tab.title)
  const inputRef = useRef<HTMLInputElement>(null)

  const Icon = TOOL_ICONS[tab.type]

  function commitRename() {
    setEditing(false)
    const trimmed = draft.trim()
    if (trimmed && trimmed !== tab.title) renameTab(tab.id, trimmed)
    else setDraft(tab.title)
  }

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('text/plain', tab.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const draggedId = e.dataTransfer.getData('text/plain')
    if (!draggedId || draggedId === tab.id) return
    const fromIndex = tabs.findIndex((x) => x.id === draggedId)
    const toIndex = tabs.findIndex((x) => x.id === tab.id)
    if (fromIndex === -1 || toIndex === -1) return
    reorderTabs(fromIndex, toIndex)
  }

  return (
    <DropdownMenu>
      <div
        draggable
        onDragStart={handleDragStart}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => setActiveTab(tab.id)}
        onDoubleClick={() => {
          setEditing(true)
          requestAnimationFrame(() => inputRef.current?.select())
        }}
        className={cn(
          'group relative flex h-8 max-w-[12rem] shrink-0 select-none items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors',
          active
            ? 'bg-secondary text-secondary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground',
        )}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename()
              if (e.key === 'Escape') {
                setDraft(tab.title)
                setEditing(false)
              }
            }}
            className="w-24 bg-transparent text-[13px] outline-none"
          />
        ) : (
          <span className="max-w-[8rem] truncate">{tab.title}</span>
        )}
        <DropdownMenuTrigger asChild>
          <button
            className="rounded-sm p-0.5 opacity-0 hover:bg-black/10 group-hover:opacity-100 dark:hover:bg-white/10"
            onClick={(e) => e.stopPropagation()}
            aria-label="more"
          >
            <MoreVertical className="h-3 w-3" />
          </button>
        </DropdownMenuTrigger>
        <button
          onClick={(e) => {
            e.stopPropagation()
            closeTab(tab.id)
          }}
          className="rounded-sm p-0.5 opacity-0 hover:bg-black/10 group-hover:opacity-100 dark:hover:bg-white/10"
          aria-label={t('tabs.close')}
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          onSelect={() => {
            setEditing(true)
            requestAnimationFrame(() => inputRef.current?.select())
          }}
        >
          {t('tabs.rename')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => duplicateTab(tab.id)}>
          <Copy /> {t('tabs.duplicate')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => closeTab(tab.id)}>
          <X /> {t('tabs.close')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function TabBar() {
  const tabs = useTabsStore((s) => s.tabs)
  const activeTabId = useTabsStore((s) => s.activeTabId)

  return (
    <div className="no-scrollbar flex min-w-0 shrink items-center gap-0.5 overflow-x-auto rounded-[10px] bg-muted/60 p-[3px]">
      {tabs.map((tab) => (
        <TabItem key={tab.id} tab={tab} active={tab.id === activeTabId} />
      ))}
      <NewTabMenu />
    </div>
  )
}

export function EmptyTabsPlaceholder() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <p className="text-lg font-medium text-foreground">{t('tabs.empty.title')}</p>
      <p className="text-sm text-muted-foreground">{t('tabs.empty.subtitle')}</p>
      <Button size="sm" onClick={() => useTabsStore.getState().addTab('format')}>
        {t('tabs.new')}
      </Button>
    </div>
  )
}
