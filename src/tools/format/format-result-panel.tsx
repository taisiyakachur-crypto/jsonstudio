import { CheckCircle2, Clipboard, Download, XCircle } from 'lucide-react'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { JsonEditor } from '@/components/json-input/json-editor'
import { JsonValueView } from '@/components/json-value-view'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/i18n'
import { formatBytes } from '@/lib/big-file'
import { downloadTextFile } from '@/lib/download-file'
import { formatJson } from '@/lib/format-json'
import type { JsonStats } from '@/lib/json-stats'
import type { JsonValidationResult } from '@/lib/validate-json'
import { cn } from '@/lib/utils'
import type { JsonValue } from '@/types/json'
import type { FormatSidebarTab } from '@/types/tabs'
import { FormatStatsStrip } from './format-stats-strip'

export type ResultView = 'code' | 'tree'

export function FormatResultPanel({
  rawValue,
  validation,
  stats,
  view,
  onViewChange,
  advancedOpen,
  onAdvancedOpenChange,
  advancedTab,
  onAdvancedTabChange,
  jsonPathQuery,
  onJsonPathQueryChange,
  schemaInput,
  onSchemaInputChange,
}: {
  rawValue: string
  validation: JsonValidationResult
  stats: JsonStats | null
  view: ResultView
  onViewChange: (view: ResultView) => void
  advancedOpen: boolean
  onAdvancedOpenChange: (open: boolean) => void
  advancedTab: Exclude<FormatSidebarTab, 'stats'>
  onAdvancedTabChange: (tab: Exclude<FormatSidebarTab, 'stats'>) => void
  jsonPathQuery: string
  onJsonPathQueryChange: (query: string) => void
  schemaInput: string
  onSchemaInputChange: (schema: string) => void
}) {
  const { t, locale } = useTranslation()
  const value = validation.valid && validation.value !== undefined ? validation.value : null
  const formatted = useMemo(() => (value !== null ? formatJson(value, '2') : ''), [value])

  function handleCopy() {
    void navigator.clipboard.writeText(formatted).then(() => toast.success(t('jsonInput.copied')))
  }

  function handleDownload() {
    downloadTextFile('data.json', formatted, 'application/json;charset=utf-8')
  }

  const isEmpty = rawValue.trim() === ''

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-3 px-4 pb-2.5 pt-3.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t('format.output.label')}
        </span>
        {!isEmpty &&
          (validation.valid ? (
            <span className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t('common.valid')}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
              <XCircle className="h-3.5 w-3.5" />
              {validation.error?.message ?? t('common.invalid')}
            </span>
          ))}
        {validation.valid && stats && (
          <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">
            {t('format.meta', { size: formatBytes(new Blob([formatted]).size, locale), nodes: stats.nodeCount })}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} disabled={!validation.valid}>
            <Clipboard className="h-3.5 w-3.5" />
            {t('common.copy')}
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={handleDownload}
            disabled={!validation.valid}
            aria-label={t('common.download')}
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          <div className="flex items-center gap-0.5 rounded-lg bg-muted/60 p-[3px] text-xs font-medium">
            <button
              onClick={() => onViewChange('code')}
              className={cn(
                'rounded-md px-2.5 py-1',
                view === 'code' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground',
              )}
            >
              {t('format.view.code')}
            </button>
            <button
              onClick={() => onViewChange('tree')}
              className={cn(
                'rounded-md px-2.5 py-1',
                view === 'tree' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground',
              )}
            >
              {t('format.view.tree')}
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {isEmpty || !validation.valid ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {t(isEmpty ? 'format.output.empty' : 'format.output.invalid')}
          </div>
        ) : view === 'code' ? (
          <JsonEditor value={formatted} softMode={false} locale={locale} readOnly />
        ) : (
          <div className="h-full overflow-auto px-4 py-3">
            <JsonValueView value={value as JsonValue} />
          </div>
        )}
      </div>

      {validation.valid && stats && (
        <FormatStatsStrip
          stats={stats}
          value={value}
          advancedOpen={advancedOpen}
          onAdvancedOpenChange={onAdvancedOpenChange}
          advancedTab={advancedTab}
          onAdvancedTabChange={onAdvancedTabChange}
          jsonPathQuery={jsonPathQuery}
          onJsonPathQueryChange={onJsonPathQueryChange}
          schemaInput={schemaInput}
          onSchemaInputChange={onSchemaInputChange}
        />
      )}
    </div>
  )
}
