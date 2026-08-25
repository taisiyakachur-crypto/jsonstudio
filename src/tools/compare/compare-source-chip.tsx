import { FileJson, PencilLine } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { formatBytes } from '@/lib/big-file'
import type { ComparePanelState } from '@/types/tabs'

export function CompareSourceChip({ panel, onEdit }: { panel: ComparePanelState; onEdit: () => void }) {
  const { locale } = useTranslation()
  const hasContent = panel.text.trim() !== ''

  return (
    <button
      onClick={onEdit}
      className="flex h-[34px] shrink-0 items-center gap-2 rounded-lg bg-muted px-3 text-[13px] font-medium transition-colors hover:bg-accent"
    >
      <FileJson className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="max-w-[160px] truncate">{panel.title}</span>
      {hasContent && (
        <span className="whitespace-nowrap font-mono text-[11px] text-muted-foreground">
          {formatBytes(new Blob([panel.text]).size, locale)}
        </span>
      )}
      <PencilLine className="h-3 w-3 shrink-0 text-muted-foreground" />
    </button>
  )
}
