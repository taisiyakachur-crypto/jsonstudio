import { BarChart3, FileJson, GitCompare, Plus, Table2, Wand2 } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { cn } from '@/lib/utils'
import { useTabsStore } from '@/store/tabs-store'
import type { AnyTab, ToolType } from '@/types/tabs'
import { NewTabMenu } from './new-tab-menu'

const TOOL_ICONS: Record<ToolType, React.ComponentType<{ className?: string }>> = {
  compare: GitCompare,
  parse: FileJson,
  table: Table2,
  chart: BarChart3,
  format: Wand2,
}

/**
 * Bottom tab bar shown below the `sm` breakpoint, replacing the header's horizontal tab pills
 * (mockup 2h: "вкладки внизу, результат згори" -- tabs at the bottom, content up top). Lists the
 * same real open tabs as the desktop TabBar (not a fixed 5-tool nav), since tabs can be
 * duplicated/renamed/reordered and a mobile user should see that same state, not a simplification
 * of it.
 */
export function MobileTabBar() {
  const { t } = useTranslation()
  const tabs = useTabsStore((s) => s.tabs)
  const activeTabId = useTabsStore((s) => s.activeTabId)
  const setActiveTab = useTabsStore((s) => s.setActiveTab)

  return (
    <nav className="no-scrollbar flex shrink-0 items-center gap-1 overflow-x-auto border-t border-border px-2 py-1.5">
      {tabs.map((tab: AnyTab) => {
        const Icon = TOOL_ICONS[tab.type]
        const active = tab.id === activeTabId
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex min-w-[56px] shrink-0 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[10px]',
              active ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <Icon className="h-[21px] w-[21px]" />
            <span className="max-w-[64px] truncate font-medium">{tab.title}</span>
          </button>
        )
      })}
      <NewTabMenu
        trigger={
          <button className="flex min-w-[56px] shrink-0 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] text-muted-foreground">
            <Plus className="h-[21px] w-[21px]" />
            <span className="font-medium">{t('tabs.new')}</span>
          </button>
        }
      />
    </nav>
  )
}
