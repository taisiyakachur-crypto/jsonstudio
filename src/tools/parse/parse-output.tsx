import { BarChart3, Clipboard, GitCompareArrows, Minimize2, Table2, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { JsonEditor } from '@/components/json-input'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/i18n'
import { formatJson, minifyJson } from '@/lib/format-json'
import { escapeJsonToString } from '@/lib/parsers'
import type { JsonValue } from '@/types/json'
import type { ToolType } from '@/types/tabs'

export function ParseOutput({
  value,
  error,
  minified,
  onMinifiedChange,
  onSendTo,
}: {
  value: JsonValue | null
  error: string | null
  minified: boolean
  onMinifiedChange: (minified: boolean) => void
  onSendTo: (type: Extract<ToolType, 'compare' | 'table' | 'chart' | 'format'>) => void
}) {
  const { t, locale } = useTranslation()

  const text = value !== null ? (minified ? minifyJson(value) : formatJson(value, '2')) : ''

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
      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-border px-2 py-1.5">
        <Button variant="ghost" size="sm" onClick={() => onMinifiedChange(!minified)} disabled={value === null}>
          <Minimize2 /> {t('common.minify')}
        </Button>
        <Button variant="ghost" size="sm" onClick={copy} disabled={value === null}>
          <Clipboard /> {t('common.copy')}
        </Button>
        <Button variant="ghost" size="sm" onClick={copyEscaped} disabled={value === null}>
          {t('parse.action.copyEscaped')}
        </Button>
        <div className="mx-1 h-4 w-px bg-border" />
        <Button variant="ghost" size="sm" onClick={() => onSendTo('compare')} disabled={value === null}>
          <GitCompareArrows /> {t('parse.action.sendToCompare')}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onSendTo('table')} disabled={value === null}>
          <Table2 /> {t('parse.action.sendToTable')}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onSendTo('chart')} disabled={value === null}>
          <BarChart3 /> {t('parse.action.sendToChart')}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onSendTo('format')} disabled={value === null}>
          <Wand2 /> {t('parse.action.sendToFormat')}
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        {error ? (
          <p className="flex h-full items-center justify-center p-8 text-center text-sm text-destructive">
            {t('parse.output.error', { message: error })}
          </p>
        ) : value === null ? (
          <p className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
            {t('parse.output.empty')}
          </p>
        ) : (
          <JsonEditor value={text} softMode={false} locale={locale} readOnly />
        )}
      </div>
    </div>
  )
}
