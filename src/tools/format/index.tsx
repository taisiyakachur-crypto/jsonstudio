import { RotateCcw, Wand2 } from 'lucide-react'
import { BigFileBanner } from '@/components/big-file-banner'
import { FileDropZone } from '@/components/file-drop-zone'
import { JsonTree } from '@/components/json-tree'
import { LoadProgressBar } from '@/components/load-progress-bar'
import { Button } from '@/components/ui/button'
import { useJsonDocument } from '@/hooks/use-json-document'
import { useTranslation } from '@/i18n'
import { formatBytes, PREVIEW_LINE_COUNT } from '@/lib/big-file'
import type { Tab } from '@/types/tabs'

export function FormatPane({ tab: _tab }: { tab: Tab<'format'> }) {
  const { t, locale } = useTranslation()
  const { status, meta, progress, error, loadFile, cancel, reset, getChildren } = useJsonDocument()

  if (status === 'idle') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
          <Wand2 className="h-7 w-7 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">{t('tool.format.name')}</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">{t('tool.format.description')}</p>
        </div>
        <FileDropZone className="w-full max-w-xl" onFile={(file) => void loadFile(file)} />
      </div>
    )
  }

  if (status === 'loading') {
    return <LoadProgressBar progress={progress} onCancel={cancel} />
  }

  if (status === 'cancelled' || status === 'error') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm text-destructive">
          {status === 'error' ? t('format.error', { message: error ?? '' }) : t('format.cancelled')}
        </p>
        <Button variant="outline" size="sm" onClick={reset}>
          <RotateCcw /> {t('format.loadNew')}
        </Button>
      </div>
    )
  }

  if (!meta) return null

  const summary =
    meta.rootType === 'object'
      ? t('format.summaryObject', { size: formatBytes(meta.byteSize, locale), count: meta.rootChildCount ?? 0 })
      : meta.rootType === 'array'
        ? t('format.summaryArray', { size: formatBytes(meta.byteSize, locale), count: meta.rootChildCount ?? 0 })
        : t('format.summaryScalar', { size: formatBytes(meta.byteSize, locale), type: meta.rootType })

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {meta.isLarge && <BigFileBanner byteSize={meta.byteSize} />}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs text-muted-foreground">{summary}</span>
        <Button variant="ghost" size="sm" onClick={reset}>
          <RotateCcw /> {t('format.loadNew')}
        </Button>
      </div>
      {meta.isLarge && (
        <details className="shrink-0 border-b border-border">
          <summary className="cursor-pointer px-3 py-2 text-xs text-muted-foreground">
            {t('format.rawPreviewTitle', { lines: PREVIEW_LINE_COUNT })}
          </summary>
          <pre className="max-h-64 overflow-auto border-t border-border bg-muted/30 p-3 font-mono text-xs">
            {meta.previewText}
          </pre>
          {meta.previewTruncated && (
            <p className="border-t border-border px-3 py-1.5 text-xs text-muted-foreground">
              {t('format.rawPreviewTruncatedNote')}
            </p>
          )}
        </details>
      )}
      <JsonTree docId={meta.id} getChildren={getChildren} className="min-h-0 flex-1" />
    </div>
  )
}
