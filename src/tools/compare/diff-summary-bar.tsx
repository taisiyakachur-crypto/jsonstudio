import { LayoutGrid, TableProperties } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import type { DiffCounts } from '@/lib/diff'
import { useTranslation } from '@/i18n'
import { cn } from '@/lib/utils'
import type { CompareTabState } from '@/types/tabs'

const STATUS_DOT: Record<'added' | 'removed' | 'changed', string> = {
  added: 'bg-emerald-500',
  removed: 'bg-rose-500',
  changed: 'bg-amber-500',
}

export function DiffSummaryBar({
  counts,
  view,
  onViewChange,
  showOnlyDifferences,
  onShowOnlyDifferencesChange,
}: {
  counts: DiffCounts
  view: CompareTabState['view']
  onViewChange: (view: 'tree' | 'table') => void
  showOnlyDifferences: boolean
  onShowOnlyDifferencesChange: (value: boolean) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-4 border-b border-border px-3 py-2 text-xs">
      {(['added', 'removed', 'changed'] as const).map((status) => (
        <span key={status} className="flex items-center gap-1.5">
          <span className={cn('h-2 w-2 rounded-full', STATUS_DOT[status])} />
          {t(`compare.summary.${status}`)}: <strong className="font-mono">{counts[status]}</strong>
        </span>
      ))}
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {t('compare.summary.same')}: <strong className="font-mono">{counts.same}</strong>
      </span>

      <label className="ml-2 flex items-center gap-1.5">
        <Checkbox checked={showOnlyDifferences} onCheckedChange={(v) => onShowOnlyDifferencesChange(v === true)} />
        {t('compare.showOnlyDifferences')}
      </label>

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant={view === 'tree' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onViewChange('tree')}
        >
          <LayoutGrid /> {t('compare.view.tree')}
        </Button>
        <Button
          variant={view === 'table' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onViewChange('table')}
        >
          <TableProperties /> {t('compare.view.table')}
        </Button>
      </div>
    </div>
  )
}
