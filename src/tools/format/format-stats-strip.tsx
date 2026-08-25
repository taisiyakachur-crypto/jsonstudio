import { PanelRightOpen } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTranslation } from '@/i18n'
import { formatBytes } from '@/lib/big-file'
import type { JsonStats } from '@/lib/json-stats'
import type { JsonValue } from '@/types/json'
import type { FormatSidebarTab } from '@/types/tabs'
import { JsonPathPanel } from './json-path-panel'
import { SchemaPanel } from './schema-panel'
import { TypeScriptPanel } from './typescript-panel'

type AdvancedTab = Exclude<FormatSidebarTab, 'stats'>

export function FormatStatsStrip({
  stats,
  value,
  advancedOpen,
  onAdvancedOpenChange,
  advancedTab,
  onAdvancedTabChange,
  jsonPathQuery,
  onJsonPathQueryChange,
  schemaInput,
  onSchemaInputChange,
}: {
  stats: JsonStats
  value: JsonValue | null
  advancedOpen: boolean
  onAdvancedOpenChange: (open: boolean) => void
  advancedTab: AdvancedTab
  onAdvancedTabChange: (tab: AdvancedTab) => void
  jsonPathQuery: string
  onJsonPathQueryChange: (query: string) => void
  schemaInput: string
  onSchemaInputChange: (schema: string) => void
}) {
  const { t, locale } = useTranslation()
  const largest = stats.largestBranches[0]

  return (
    <div className="flex shrink-0 items-stretch gap-px border-t border-border bg-border text-xs">
      <div className="flex-1 bg-background px-4 py-2.5">
        <span className="block text-[11px] text-muted-foreground">{t('format.stats.nodes')}</span>
        <span className="font-mono text-[15px]">{stats.nodeCount}</span>
      </div>
      <div className="flex-1 bg-background px-4 py-2.5">
        <span className="block text-[11px] text-muted-foreground">{t('format.stats.depth')}</span>
        <span className="font-mono text-[15px]">{stats.maxDepth}</span>
      </div>
      <div className="flex-1 bg-background px-4 py-2.5">
        <span className="block text-[11px] text-muted-foreground">
          {t('format.stats.uniqueKeys', { count: stats.uniqueKeys.length })}
        </span>
        <span className="font-mono text-[15px]">{stats.uniqueKeys.length}</span>
      </div>
      <div className="min-w-0 flex-[2] bg-background px-4 py-2.5">
        <span className="block truncate text-[11px] text-muted-foreground">{t('format.stats.largestBranches')}</span>
        {largest ? (
          <span className="block truncate font-mono text-[13px] text-secondary-foreground">
            {largest.key} <span className="text-muted-foreground">{formatBytes(largest.bytes, locale)}</span>
          </span>
        ) : (
          <span className="font-mono text-[13px] text-muted-foreground">—</span>
        )}
      </div>
      <Popover open={advancedOpen} onOpenChange={onAdvancedOpenChange}>
        <PopoverTrigger asChild>
          <button className="flex shrink-0 items-center gap-2 bg-background px-4 py-2.5 font-medium text-primary hover:bg-accent">
            <PanelRightOpen className="h-[15px] w-[15px]" />
            {t('format.advanced.trigger')}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" side="top" className="w-[420px] p-4">
          <Tabs value={advancedTab} onValueChange={(v) => onAdvancedTabChange(v as AdvancedTab)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="jsonpath">{t('format.sidebar.jsonpath')}</TabsTrigger>
              <TabsTrigger value="schema">{t('format.sidebar.schema')}</TabsTrigger>
              <TabsTrigger value="typescript">{t('format.sidebar.typescript')}</TabsTrigger>
            </TabsList>
            <TabsContent value="jsonpath">
              <JsonPathPanel value={value} query={jsonPathQuery} onQueryChange={onJsonPathQueryChange} />
            </TabsContent>
            <TabsContent value="schema">
              <SchemaPanel value={value} schemaInput={schemaInput} onSchemaInputChange={onSchemaInputChange} />
            </TabsContent>
            <TabsContent value="typescript">
              <TypeScriptPanel value={value} />
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>
    </div>
  )
}
