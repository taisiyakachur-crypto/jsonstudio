import { Trash2, X } from 'lucide-react'
import { JsonInput } from '@/components/json-input'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useTranslation } from '@/i18n'
import type { ComparePanelState } from '@/types/tabs'

export function CompareEditDialog({
  panel,
  open,
  onOpenChange,
  onTextChange,
  onSoftModeChange,
  onTitleChange,
  onModeChange,
  onLoadExample,
  onRemove,
}: {
  panel: ComparePanelState | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onTextChange: (text: string) => void
  onSoftModeChange: (soft: boolean) => void
  onTitleChange: (title: string) => void
  onModeChange: (mode: 'small' | 'big') => void
  onLoadExample?: () => void
  onRemove?: () => void
}) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="flex h-[70vh] max-w-3xl flex-col gap-0 overflow-hidden p-0">
        <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-2">
          <DialogTitle asChild>
            <input
              value={panel?.title ?? ''}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder={t('tabs.rename')}
              className="min-w-0 flex-1 truncate bg-transparent text-sm font-medium outline-none"
            />
          </DialogTitle>
          {onRemove && (
            <button
              onClick={() => {
                onRemove()
                onOpenChange(false)
              }}
              className="shrink-0 rounded-sm p-1 text-muted-foreground hover:bg-accent"
              title={t('compare.removePanel')}
              aria-label={t('compare.removePanel')}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => onOpenChange(false)}
            className="shrink-0 rounded-sm p-1 text-muted-foreground hover:bg-accent"
            aria-label={t('common.cancel')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {panel && (
          <JsonInput
            value={panel.text}
            onChange={onTextChange}
            softMode={panel.softMode}
            onSoftModeChange={onSoftModeChange}
            onModeChange={onModeChange}
            onLoadExample={onLoadExample}
            className="min-h-0"
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
