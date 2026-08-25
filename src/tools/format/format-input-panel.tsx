import { Braces, Clipboard, Minimize2, SortAsc, Trash2, Upload } from 'lucide-react'
import { useState } from 'react'
import { FileDropZone } from '@/components/file-drop-zone'
import { JsonEditor } from '@/components/json-input/json-editor'
import type { useJsonInputState } from '@/components/json-input/use-json-input-state'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useTranslation } from '@/i18n'
import { cn } from '@/lib/utils'

type InputState = ReturnType<typeof useJsonInputState>

export function FormatInputPanel({
  value,
  onChange,
  softMode,
  onSoftModeChange,
  onLoadExample,
  state,
}: {
  value: string
  onChange: (value: string) => void
  softMode: boolean
  onSoftModeChange: (soft: boolean) => void
  onLoadExample?: () => void
  state: InputState
}) {
  const { t, locale } = useTranslation()
  const [dragOver, setDragOver] = useState(false)

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        setDragOver(false)
        state.handleDrop(e)
      }}
      onKeyDownCapture={state.handleKeyDown}
      className="relative flex w-[380px] shrink-0 flex-col overflow-hidden border-r border-border"
    >
      {dragOver && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center border-2 border-dashed border-primary bg-primary/5 text-sm text-primary">
          {t('common.dropFile')}
        </div>
      )}
      <div className="flex shrink-0 items-center justify-between px-4 pb-2.5 pt-3.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t('format.input.label')}
        </span>
        <div className="flex items-center gap-3 text-muted-foreground">
          <button onClick={state.chooseFile} title={t('common.chooseFile')} className="hover:text-foreground">
            <Upload className="h-[15px] w-[15px]" />
          </button>
          <button
            onClick={() => void state.pasteFromClipboard()}
            title={t('common.pasteClipboard')}
            className="hover:text-foreground"
          >
            <Clipboard className="h-[15px] w-[15px]" />
          </button>
          <button onClick={state.handleClear} title={t('common.clear')} className="hover:text-foreground">
            <Trash2 className="h-[15px] w-[15px]" />
          </button>
        </div>
      </div>

      {value.trim() === '' ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 pb-6">
          <FileDropZone onFile={(f) => void state.loadFile(f)} className="w-full" />
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void state.pasteFromClipboard()}>
              {t('common.pasteClipboard')}
            </Button>
            {onLoadExample && (
              <Button variant="outline" size="sm" onClick={onLoadExample}>
                {t('common.loadExample')}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="mx-3 min-h-0 flex-1 overflow-hidden rounded-[10px] bg-card shadow-[0_0_0_1px_hsl(var(--border))]">
            <JsonEditor value={value} onChange={onChange} softMode={softMode} locale={locale} />
          </div>
          <div className="flex flex-wrap items-center gap-1.5 p-3">
            <Button size="sm" className="rounded-lg" onClick={state.handleFormat}>
              <Braces className="h-3.5 w-3.5" />
              {t('common.format')}
            </Button>
            <Button variant="outline" size="sm" className="rounded-lg" onClick={state.handleMinify}>
              <Minimize2 className="h-3.5 w-3.5" />
              {t('common.minify')}
            </Button>
            <Button variant="outline" size="sm" className="rounded-lg" onClick={state.handleSortKeys}>
              <SortAsc className="h-3.5 w-3.5" />
              A→Z
            </Button>
            <label
              className={cn(
                'ml-auto flex items-center gap-2 text-xs',
                softMode ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              <Switch checked={softMode} onCheckedChange={onSoftModeChange} />
              {t('common.softMode')}
            </label>
          </div>
        </>
      )}
    </div>
  )
}
