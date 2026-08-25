import CodeMirror from '@uiw/react-codemirror'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { FileDropZone } from '@/components/file-drop-zone'
import { Button } from '@/components/ui/button'
import { useResolvedTheme } from '@/hooks/use-resolved-theme'
import { useTranslation } from '@/i18n'
import { cn } from '@/lib/utils'

/**
 * A plain text editor for Parse's input side: unlike `JsonInput`, the content isn't JSON (it
 * might be a log line, CSV, YAML, ...), so there's no validity indicator, JSON syntax
 * highlighting, or JSON-only toolbar -- just paste/drop/choose-file and a line-numbered box.
 */
export function RawTextInput({
  value,
  onChange,
  onLoadExample,
  className,
}: {
  value: string
  onChange: (value: string) => void
  onLoadExample?: () => void
  className?: string
}) {
  const { t } = useTranslation()
  const theme = useResolvedTheme()
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function loadFile(file: File) {
    onChange(await file.text())
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText()
      if (!text) {
        toast.message(t('jsonInput.clipboardEmpty'))
        return
      }
      onChange(text)
    } catch {
      toast.error(t('jsonInput.pasteError'))
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) void loadFile(file)
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
        <FileDropZone accept="" onFile={(f) => void loadFile(f)} className="w-full max-w-xl" />
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
      className={cn('relative flex flex-1 flex-col overflow-hidden', className)}
    >
      {dragOver && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center border-2 border-dashed border-primary bg-primary/5 text-sm text-primary">
          {t('common.dropFile')}
        </div>
      )}
      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-border px-2 py-1.5">
        <Button variant="ghost" size="sm" onClick={() => void pasteFromClipboard()}>
          {t('common.pasteClipboard')}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
          {t('common.chooseFile')}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void loadFile(file)
            e.target.value = ''
          }}
        />
        <Button variant="ghost" size="sm" onClick={() => onChange('')}>
          {t('common.clear')}
        </Button>
      </div>
      <div className="h-full min-h-0 flex-1 [&_.cm-editor]:h-full">
        <CodeMirror
          value={value}
          onChange={onChange}
          theme={theme}
          height="100%"
          basicSetup={{ tabSize: 2 }}
          className="h-full text-sm"
        />
      </div>
    </div>
  )
}
