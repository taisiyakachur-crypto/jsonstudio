import { X } from 'lucide-react'
import { JsonInput } from '@/components/json-input'
import { useTranslation } from '@/i18n'
import type { ComparePanelState } from '@/types/tabs'

export function ComparePanel({
  panel,
  onTextChange,
  onSoftModeChange,
  onTitleChange,
  onModeChange,
  onLoadExample,
  onRemove,
}: {
  panel: ComparePanelState
  onTextChange: (text: string) => void
  onSoftModeChange: (soft: boolean) => void
  onTitleChange: (title: string) => void
  onModeChange: (mode: 'small' | 'big') => void
  onLoadExample?: () => void
  /** Omit to hide the remove button (e.g. below the 2-panel minimum). */
  onRemove?: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="flex min-w-[280px] flex-1 flex-col overflow-hidden border border-border">
      <div className="flex shrink-0 items-center border-b border-border bg-muted/30">
        <input
          value={panel.title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={t('tabs.rename')}
          className="min-w-0 flex-1 bg-transparent px-3 py-1.5 text-sm font-medium outline-none focus:bg-background"
        />
        {onRemove && (
          <button
            onClick={onRemove}
            className="mr-1 shrink-0 rounded-sm p-1 text-muted-foreground hover:bg-accent"
            title={t('compare.removePanel')}
            aria-label={t('compare.removePanel')}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <JsonInput
        value={panel.text}
        onChange={onTextChange}
        softMode={panel.softMode}
        onSoftModeChange={onSoftModeChange}
        onModeChange={onModeChange}
        onLoadExample={onLoadExample}
        className="min-h-0"
      />
    </div>
  )
}
