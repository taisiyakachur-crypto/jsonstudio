import { GitCompareArrows, LayoutGrid, TableProperties } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useTranslation } from '@/i18n'
import { cn } from '@/lib/utils'

export type CompareView = 'tree' | 'table' | 'side-by-side'

export interface SummaryStat {
  key: string
  label: string
  value: number
  dotClass?: string
}

export function DiffSummaryBar({
  stats,
  view,
  onViewChange,
  showTreeOption,
  showOnlyDifferences,
  onShowOnlyDifferencesChange,
}: {
  stats: SummaryStat[]
  view: CompareView
  onViewChange: (view: CompareView) => void
  /** Tree view only makes sense for a pairwise (2-panel) comparison. */
  showTreeOption: boolean
  showOnlyDifferences: boolean
  onShowOnlyDifferencesChange: (value: boolean) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-4 border-b border-border px-3 py-2 text-xs">
      {stats.map((stat) => (
        <span key={stat.key} className="flex items-center gap-1.5">
          {stat.dotClass && <span className={cn('h-2 w-2 rounded-full', stat.dotClass)} />}
          {stat.label}: <strong className="font-mono">{stat.value}</strong>
        </span>
      ))}

      <label className="ml-2 flex items-center gap-1.5">
        <Checkbox checked={showOnlyDifferences} onCheckedChange={(v) => onShowOnlyDifferencesChange(v === true)} />
        {t('compare.showOnlyDifferences')}
      </label>

      <div className="ml-auto flex items-center gap-1">
        {showTreeOption && (
          <Button variant={view === 'tree' ? 'secondary' : 'ghost'} size="sm" onClick={() => onViewChange('tree')}>
            <LayoutGrid /> {t('compare.view.tree')}
          </Button>
        )}
        <Button variant={view === 'table' ? 'secondary' : 'ghost'} size="sm" onClick={() => onViewChange('table')}>
          <TableProperties /> {t('compare.view.table')}
        </Button>
        <Button
          variant={view === 'side-by-side' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onViewChange('side-by-side')}
        >
          <GitCompareArrows /> {t('compare.view.sideBySide')}
        </Button>
      </div>
    </div>
  )
}
