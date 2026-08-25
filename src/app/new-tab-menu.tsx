import { BarChart3, FileJson, GitCompare, Plus, Table2, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTranslation } from '@/i18n'
import { useTabsStore } from '@/store/tabs-store'
import type { ToolType } from '@/types/tabs'

const TOOL_ICONS: Record<ToolType, React.ComponentType<{ className?: string }>> = {
  compare: GitCompare,
  parse: FileJson,
  table: Table2,
  chart: BarChart3,
  format: Wand2,
}

const TOOL_ORDER: ToolType[] = ['compare', 'parse', 'table', 'chart', 'format']

export function NewTabMenu() {
  const { t } = useTranslation()
  const addTab = useTabsStore((s) => s.addTab)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" title={t('tabs.new')} aria-label={t('tabs.new')}>
          <Plus />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {TOOL_ORDER.map((type) => {
          const Icon = TOOL_ICONS[type]
          return (
            <DropdownMenuItem key={type} onSelect={() => addTab(type)}>
              <Icon className="text-muted-foreground" />
              {t(`tabs.newTool.${type}`)}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
