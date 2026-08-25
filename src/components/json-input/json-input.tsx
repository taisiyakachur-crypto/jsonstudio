import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { BigFileBanner } from '@/components/big-file-banner'
import { FileDropZone } from '@/components/file-drop-zone'
import { JsonTree } from '@/components/json-tree'
import { LoadProgressBar } from '@/components/load-progress-bar'
import { Button } from '@/components/ui/button'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useJsonDocument } from '@/hooks/use-json-document'
import { useTranslation } from '@/i18n'
import { EDITOR_SIZE_LIMIT_BYTES, formatBytes, PREVIEW_LINE_COUNT } from '@/lib/big-file'
import { formatJson, type IndentOption, minifyJson } from '@/lib/format-json'
import { computeJsonStats, type JsonStats } from '@/lib/json-stats'
import { sortJsonKeysDeep } from '@/lib/sort-json-keys'
import { cn } from '@/lib/utils'
import { validateJson } from '@/lib/validate-json'
import type { JsonValue } from '@/types/json'
import { JsonEditor } from './json-editor'
import { JsonInputToolbar } from './json-input-toolbar'
import { ValidityBar } from './validity-bar'

const VALIDATION_DEBOUNCE_MS = 300

export interface JsonInputProps {
  value: string
  onChange: (value: string) => void
  softMode: boolean
  onSoftModeChange: (soft: boolean) => void
  onLoadExample?: () => void
  /** Indent used by the toolbar's "Format" quick action. Defaults to 2 spaces. */
  formatIndent?: IndentOption
  /** Notified when the input switches between the CodeMirror editor and the read-only big-file tree. */
  onModeChange?: (mode: 'small' | 'big') => void
  /** Notified with the live document stats whenever the (debounced, valid) content changes. */
  onStatsChange?: (stats: JsonStats | null) => void
  /** Notified with the live parsed value whenever the (debounced, valid) content changes. */
  onValueChange?: (value: JsonValue | null) => void
  className?: string
}

export function JsonInput({
  value,
  onChange,
  softMode,
  onSoftModeChange,
  onLoadExample,
  formatIndent = '2',
  onModeChange,
  onStatsChange,
  onValueChange,
  className,
}: JsonInputProps) {
  const { t, locale } = useTranslation()
  const bigDoc = useJsonDocument()
  const [bigActive, setBigActive] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const debouncedValue = useDebouncedValue(value, VALIDATION_DEBOUNCE_MS)
  const validation = useMemo(
    () => validateJson(debouncedValue, softMode, locale),
    [debouncedValue, softMode, locale],
  )
  const stats = useMemo(
    () => (validation.valid && validation.value !== undefined ? computeJsonStats(validation.value) : null),
    [validation],
  )

  useEffect(() => {
    onModeChange?.(bigActive ? 'big' : 'small')
  }, [bigActive, onModeChange])

  useEffect(() => {
    onStatsChange?.(stats)
  }, [stats, onStatsChange])

  useEffect(() => {
    onValueChange?.(validation.valid && validation.value !== undefined ? validation.value : null)
  }, [validation, onValueChange])

  async function loadFile(file: File) {
    if (file.size > EDITOR_SIZE_LIMIT_BYTES) {
      setBigActive(true)
      await bigDoc.loadFile(file)
    } else {
      setBigActive(false)
      onChange(await file.text())
    }
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText()
      if (!text) {
        toast.message(t('jsonInput.clipboardEmpty'))
        return
      }
      if (new Blob([text]).size > EDITOR_SIZE_LIMIT_BYTES) {
        setBigActive(true)
        await bigDoc.loadText(text)
      } else {
        setBigActive(false)
        onChange(text)
      }
    } catch {
      toast.error(t('jsonInput.pasteError'))
    }
  }

  function chooseFile() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,.txt,application/json,text/plain'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) void loadFile(file)
    }
    input.click()
  }

  function currentParsedOrToast(): ReturnType<typeof validateJson> | undefined {
    const result = validateJson(value, softMode, locale)
    if (!result.valid || result.value === undefined) {
      toast.error(t('jsonInput.formatError'))
      return undefined
    }
    return result
  }

  function handleFormat() {
    const result = currentParsedOrToast()
    if (result) onChange(formatJson(result.value, formatIndent))
  }

  function handleMinify() {
    const result = currentParsedOrToast()
    if (result) onChange(minifyJson(result.value))
  }

  function handleSortKeys() {
    const result = currentParsedOrToast()
    if (result) onChange(formatJson(sortJsonKeysDeep(result.value!), '2'))
  }

  function handleCopy() {
    void navigator.clipboard.writeText(value).then(() => toast.success(t('jsonInput.copied')))
  }

  function handleClear() {
    onChange('')
    setBigActive(false)
    bigDoc.reset()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    const mod = e.metaKey || e.ctrlKey
    if (!mod) return
    if (e.key === 'Enter' || (e.shiftKey && e.key.toLowerCase() === 'f')) {
      e.preventDefault()
      handleFormat()
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) void loadFile(file)
  }

  if (bigActive) {
    return (
      <div className={cn('flex flex-1 flex-col overflow-hidden', className)}>
        {bigDoc.status === 'loading' && (
          <LoadProgressBar progress={bigDoc.progress} onCancel={bigDoc.cancel} />
        )}
        {(bigDoc.status === 'cancelled' || bigDoc.status === 'error') && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <p className="text-sm text-destructive">
              {bigDoc.status === 'error'
                ? t('format.error', { message: bigDoc.error ?? '' })
                : t('format.cancelled')}
            </p>
            <Button variant="outline" size="sm" onClick={() => setBigActive(false)}>
              {t('format.loadNew')}
            </Button>
          </div>
        )}
        {bigDoc.status === 'ready' && bigDoc.meta && (
          <>
            <BigFileBanner byteSize={bigDoc.meta.byteSize} />
            <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
              <span className="text-xs text-muted-foreground">
                {formatBytes(bigDoc.meta.byteSize, locale)} · {bigDoc.meta.rootType} ·{' '}
                {bigDoc.meta.rootChildCount ?? 0}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setBigActive(false)}>
                {t('format.loadNew')}
              </Button>
            </div>
            <details className="shrink-0 border-b border-border">
              <summary className="cursor-pointer px-3 py-2 text-xs text-muted-foreground">
                {t('format.rawPreviewTitle', { lines: PREVIEW_LINE_COUNT })}
              </summary>
              <pre className="max-h-64 overflow-auto border-t border-border bg-muted/30 p-3 font-mono text-xs">
                {bigDoc.meta.previewText}
              </pre>
            </details>
            <JsonTree docId={bigDoc.meta.id} getChildren={bigDoc.getChildren} className="min-h-0 flex-1" />
          </>
        )}
      </div>
    )
  }

  if (value.trim() === '') {
    return (
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn('flex flex-1 flex-col items-center justify-center gap-4 p-8', className)}
      >
        <FileDropZone onFile={(f) => void loadFile(f)} className="w-full max-w-xl" />
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void pasteFromClipboard()}>
            {t('common.pasteClipboard')}
          </Button>
          {onLoadExample && (
            <Button variant="outline" size="sm" onClick={onLoadExample}>
              {t('common.loadExample')}
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onKeyDownCapture={handleKeyDown}
      className={cn('relative flex flex-1 flex-col overflow-hidden', className)}
    >
      {dragOver && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center border-2 border-dashed border-primary bg-primary/5 text-sm text-primary">
          {t('common.dropFile')}
        </div>
      )}
      <JsonInputToolbar
        onFormat={handleFormat}
        onMinify={handleMinify}
        onCopy={handleCopy}
        onClear={handleClear}
        onSortKeys={handleSortKeys}
        onPasteClipboard={() => void pasteFromClipboard()}
        onChooseFile={chooseFile}
        softMode={softMode}
        onSoftModeChange={onSoftModeChange}
      />
      <ValidityBar
        text={debouncedValue}
        result={validation}
        nodeCount={stats?.nodeCount}
        maxDepth={stats?.maxDepth}
      />
      <div className="min-h-0 flex-1">
        <JsonEditor value={value} onChange={onChange} softMode={softMode} locale={locale} />
      </div>
    </div>
  )
}
