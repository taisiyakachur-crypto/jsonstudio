import { UploadCloud } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/i18n'
import { cn } from '@/lib/utils'

export function FileDropZone({
  onFile,
  accept = '.json,.txt,application/json,text/plain',
  className,
}: {
  onFile: (file: File) => void
  accept?: string
  className?: string
}) {
  const { t } = useTranslation()
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    // Several callers wrap this in their own onDrop (for a page-wide "drop anywhere" overlay)
    // -- without this, both handlers would fire for one drop and load the file twice.
    e.stopPropagation()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors',
        dragOver ? 'border-primary bg-primary/5' : 'border-border',
        className,
      )}
    >
      <UploadCloud className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{t('common.dropFile')}</p>
      <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
        {t('common.chooseFile')}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
