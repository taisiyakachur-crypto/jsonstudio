import { Clipboard, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/i18n'
import { downloadTextFile } from '@/lib/download-file'

export interface ExportFormat {
  id: string
  label: string
  filename: string
  mimeType: string
  getContent: () => string
}

/** Shared "export the current result" toolbar: one copy + one download button per format. */
export function ExportBar({ formats, className }: { formats: ExportFormat[]; className?: string }) {
  const { t } = useTranslation()

  function copy(format: ExportFormat) {
    void navigator.clipboard.writeText(format.getContent()).then(() => {
      toast.success(t('jsonInput.copied'))
    })
  }

  function download(format: ExportFormat) {
    downloadTextFile(format.filename, format.getContent(), format.mimeType)
  }

  return (
    <div className={className ?? 'flex flex-wrap items-center gap-2'}>
      {formats.map((format) => (
        <div key={format.id} className="flex items-center gap-0.5 rounded-md border border-border pl-2">
          <span className="text-xs text-muted-foreground">{format.label}</span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => copy(format)}
            title={t('common.copy')}
            aria-label={`${t('common.copy')} ${format.label}`}
          >
            <Clipboard className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => download(format)}
            title={t('common.download')}
            aria-label={`${t('common.download')} ${format.label}`}
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  )
}
