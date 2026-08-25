import { Braces, Clipboard, Minimize2, SortAsc, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/i18n'
import { cn } from '@/lib/utils'

export function JsonInputToolbar({
  onFormat,
  onMinify,
  onCopy,
  onClear,
  onSortKeys,
  onPasteClipboard,
  onChooseFile,
  softMode,
  onSoftModeChange,
  disabled,
}: {
  onFormat: () => void
  onMinify: () => void
  onCopy: () => void
  onClear: () => void
  onSortKeys: () => void
  onPasteClipboard: () => void
  onChooseFile: () => void
  softMode: boolean
  onSoftModeChange: (soft: boolean) => void
  disabled?: boolean
}) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border px-2 py-1.5">
      <Button variant="ghost" size="sm" onClick={onFormat} disabled={disabled}>
        <Braces /> {t('common.format')}
      </Button>
      <Button variant="ghost" size="sm" onClick={onMinify} disabled={disabled}>
        <Minimize2 /> {t('common.minify')}
      </Button>
      <Button variant="ghost" size="sm" onClick={onSortKeys} disabled={disabled}>
        <SortAsc /> {t('common.sortKeys')}
      </Button>
      <Button variant="ghost" size="sm" onClick={onCopy} disabled={disabled}>
        <Clipboard /> {t('common.copy')}
      </Button>
      <Button variant="ghost" size="sm" onClick={onClear} disabled={disabled}>
        <Trash2 /> {t('common.clear')}
      </Button>
      <div className="mx-1 h-4 w-px bg-border" />
      <Button variant="ghost" size="sm" onClick={onPasteClipboard}>
        <Clipboard /> {t('common.pasteClipboard')}
      </Button>
      <Button variant="ghost" size="sm" onClick={onChooseFile}>
        <Upload /> {t('common.chooseFile')}
      </Button>
      <button
        onClick={() => onSoftModeChange(!softMode)}
        className={cn(
          'ml-auto flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors',
          softMode
            ? 'border-primary/40 bg-primary/10 text-primary'
            : 'border-border text-muted-foreground hover:bg-accent',
        )}
        aria-pressed={softMode}
      >
        <span
          className={cn(
            'h-3.5 w-3.5 rounded-full border',
            softMode ? 'border-primary bg-primary' : 'border-muted-foreground',
          )}
        />
        {t('common.softMode')}
      </button>
    </div>
  )
}
