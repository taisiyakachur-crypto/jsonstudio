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
}: {
  panel: ComparePanelState
  onTextChange: (text: string) => void
  onSoftModeChange: (soft: boolean) => void
  onTitleChange: (title: string) => void
  onModeChange: (mode: 'small' | 'big') => void
  onLoadExample?: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden border border-border">
      <input
        value={panel.title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder={t('tabs.rename')}
        className="shrink-0 border-b border-border bg-muted/30 px-3 py-1.5 text-sm font-medium outline-none focus:bg-background"
      />
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
