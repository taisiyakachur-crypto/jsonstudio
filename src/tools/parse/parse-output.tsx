import { BarChart3, CheckCircle2, Clipboard, GitCompareArrows, Minimize2, Table2, Wand2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { JsonEditor } from '@/components/json-input'
import { Switch } from '@/components/ui/switch'
import { useTranslation } from '@/i18n'
import { formatBytes } from '@/lib/big-file'
import { formatJson, minifyJson } from '@/lib/format-json'
import { escapeJsonToString } from '@/lib/parsers'
import { cn } from '@/lib/utils'
import type { JsonValue } from '@/types/json'
import type { ToolType } from '@/types/tabs'

export function ParseOutput({
  value,
  error,
  minified,
  onMinifiedChange,
  onSendTo,
  showCoerceTypes,
  coerceTypes,
  onCoerceTypesChange,
}: {
  value: JsonValue | null
  error: string | null
  minified: boolean
  onMinifiedChange: (minified: boolean) => void
  onSendTo: (type: Extract<ToolType, 'compare' | 'table' | 'chart' | 'format'>) => void
  /** Only CSV parsing currently supports disabling type coercion. */
  showCoerceTypes: boolean
  coerceTypes: boolean
  onCoerceTypesChange: (coerce: boolean) => void
}) {
  const { t, locale } = useTranslation()

  const text = value !== null ? (minified ? minifyJson(value) : formatJson(value, '2')) : ''
  const count = Array.isArray(value) ? value.length : undefined

  function copy() {
    void navigator.clipboard.writeText(text).then(() => toast.success(t('jsonInput.copied')))
  }

  function copyEscaped() {
    if (value === null) return
    void navigator.clipboard
      .writeText(escapeJsonToString(value))
      .then(() => toast.success(t('parse.escapedCopiedToast')))
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center gap-2.5 px-4 pb-2.5 pt-3.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t('parse.output.title')}
        </span>
        {value !== null && (
          <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {count !== undefined ? t('parse.output.count', { count }) : t('common.valid')}
          </span>
        )}
        {error && (
          <span className="flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
            <XCircle className="h-3.5 w-3.5" />
            {t('common.invalid')}
          </span>
        )}
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => onMinifiedChange(!minified)}
            disabled={value === null}
            className="flex h-[30px] items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
          >
            <Minimize2 className="h-3.5 w-3.5" />
            {t('common.minify')}
          </button>
          <button
            onClick={copy}
            disabled={value === null}
            className="flex h-[30px] items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
          >
            <Clipboard className="h-3.5 w-3.5" />
            {t('common.copy')}
          </button>
          <button
            onClick={copyEscaped}
            disabled={value === null}
            className="flex h-[30px] items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
          >
            {t('parse.action.copyEscaped')}
          </button>
          <div className="mx-0.5 h-4 w-px bg-border" />
          <button
            onClick={() => onSendTo('compare')}
            disabled={value === null}
            className="flex h-[30px] items-center gap-1.5 rounded-lg bg-secondary px-2.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 disabled:pointer-events-none disabled:opacity-50"
          >
            <GitCompareArrows className="h-3.5 w-3.5" />
            {t('parse.action.sendToCompare')}
          </button>
          <button
            onClick={() => onSendTo('table')}
            disabled={value === null}
            className="flex h-[30px] items-center gap-1.5 rounded-lg bg-secondary px-2.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 disabled:pointer-events-none disabled:opacity-50"
          >
            <Table2 className="h-3.5 w-3.5" />
            {t('parse.action.sendToTable')}
          </button>
          <button
            onClick={() => onSendTo('chart')}
            disabled={value === null}
            className="flex h-[30px] items-center gap-1.5 rounded-lg bg-secondary px-2.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 disabled:pointer-events-none disabled:opacity-50"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            {t('parse.action.sendToChart')}
          </button>
          <button
            onClick={() => onSendTo('format')}
            disabled={value === null}
            className="flex h-[30px] items-center gap-1.5 rounded-lg bg-secondary px-2.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 disabled:pointer-events-none disabled:opacity-50"
          >
            <Wand2 className="h-3.5 w-3.5" />
            {t('parse.action.sendToFormat')}
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden pl-4">
        {error ? (
          <p className="flex h-full items-center justify-center pr-4 text-center text-sm text-destructive">
            {t('parse.output.error', { message: error })}
          </p>
        ) : value === null ? (
          <p className="flex h-full items-center justify-center pr-4 text-center text-sm text-muted-foreground">
            {t('parse.output.empty')}
          </p>
        ) : (
          <JsonEditor value={text} softMode={false} locale={locale} readOnly />
        )}
      </div>
      {value !== null && (
        <div className="flex shrink-0 items-center gap-3 border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
          {showCoerceTypes && (
            <label className={cn('flex items-center gap-2', coerceTypes && 'text-foreground')}>
              <Switch checked={coerceTypes} onCheckedChange={onCoerceTypesChange} />
              {t('parse.csvCoerceTypes')}
            </label>
          )}
          <span className="ml-auto font-mono">{formatBytes(new Blob([text]).size, locale)}</span>
        </div>
      )}
    </div>
  )
}
