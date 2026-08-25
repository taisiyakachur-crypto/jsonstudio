import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTranslation } from '@/i18n'
import { formatBytes } from '@/lib/big-file'
import type { JsonStats } from '@/lib/json-stats'
import type { FormatSidebarTab, FormatTabState } from '@/types/tabs'
import type { JsonValue } from '@/types/json'
import { JsonPathPanel } from './json-path-panel'
import { SchemaPanel } from './schema-panel'
import { TypeScriptPanel } from './typescript-panel'

export function FormatSidebar({
  indent,
  onIndentChange,
  stats,
  value,
  sidebarTab,
  onSidebarTabChange,
  jsonPathQuery,
  onJsonPathQueryChange,
  schemaInput,
  onSchemaInputChange,
}: {
  indent: FormatTabState['indent']
  onIndentChange: (indent: FormatTabState['indent']) => void
  stats: JsonStats | null
  value: JsonValue | null
  sidebarTab: FormatSidebarTab
  onSidebarTabChange: (tab: FormatSidebarTab) => void
  jsonPathQuery: string
  onJsonPathQueryChange: (query: string) => void
  schemaInput: string
  onSchemaInputChange: (schema: string) => void
}) {
  const { t, locale } = useTranslation()

  return (
    <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto border-l border-border p-3">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          {t('format.indent.title')}
        </label>
        <Select value={indent} onValueChange={(v) => onIndentChange(v as FormatTabState['indent'])}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2</SelectItem>
            <SelectItem value="4">4</SelectItem>
            <SelectItem value="tab">{t('format.indent.tab')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={sidebarTab} onValueChange={(v) => onSidebarTabChange(v as FormatSidebarTab)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="stats">{t('format.sidebar.stats')}</TabsTrigger>
          <TabsTrigger value="jsonpath">{t('format.sidebar.jsonpath')}</TabsTrigger>
          <TabsTrigger value="schema">{t('format.sidebar.schema')}</TabsTrigger>
          <TabsTrigger value="typescript">{t('format.sidebar.typescript')}</TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          {stats ? (
            <div className="flex flex-col gap-3 rounded-md border border-border p-3 text-xs">
              <p className="font-medium text-foreground">{t('format.stats.title')}</p>
              <dl className="grid grid-cols-2 gap-y-1.5 text-muted-foreground">
                <dt>{t('format.stats.nodes')}</dt>
                <dd className="text-right font-mono text-foreground">{stats.nodeCount}</dd>
                <dt>{t('format.stats.depth')}</dt>
                <dd className="text-right font-mono text-foreground">{stats.maxDepth}</dd>
              </dl>
              <div>
                <p className="mb-1 text-muted-foreground">
                  {t('format.stats.uniqueKeys', { count: stats.uniqueKeys.length })}
                </p>
                <div className="flex max-h-24 flex-wrap gap-1 overflow-y-auto">
                  {stats.uniqueKeys.map((key) => (
                    <span key={key} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                      {key}
                    </span>
                  ))}
                </div>
              </div>
              {stats.largestBranches.length > 0 && (
                <div>
                  <p className="mb-1 text-muted-foreground">{t('format.stats.largestBranches')}</p>
                  <ul className="flex flex-col gap-1">
                    {stats.largestBranches.map((branch) => (
                      <li key={branch.key} className="flex items-center justify-between gap-2">
                        <span className="truncate font-mono">{branch.key}</span>
                        <span className="shrink-0 text-muted-foreground">
                          {formatBytes(branch.bytes, locale)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{t('format.sidebar.unavailable')}</p>
          )}
        </TabsContent>

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
    </aside>
  )
}
