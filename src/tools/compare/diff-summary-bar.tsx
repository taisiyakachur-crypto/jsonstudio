import { GitCompareArrows, LayoutGrid, TableProperties } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { useTranslation } from '@/i18n'
import { cn } from '@/lib/utils'

export type CompareView = 'tree' | 'table' | 'side-by-side'

export interface SummaryStat {
  key: string
  label: string
  value: number
  /** Tailwind color token to tint the card with (e.g. "success", "destructive", "warning").
   *  Omit for a neutral card (e.g. "same"). */
  tone?: 'success' | 'destructive' | 'warning'
}

const TONE_CLASS: Record<NonNullable<SummaryStat['tone']>, string> = {
  success: 'bg-gradient-to-b from-success/15 to-success/5 ring-1 ring-inset ring-success/25 text-success',
  destructive:
    'bg-gradient-to-b from-destructive/15 to-destructive/5 ring-1 ring-inset ring-destructive/25 text-destructive',
  warning: 'bg-gradient-to-b from-warning/20 to-warning/5 ring-1 ring-inset ring-warning/30 text-warning',
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
    <div className="flex shrink-0 flex-wrap gap-2.5 px-4 pb-3.5 pt-1">
      {stats.map((stat) => (
        <div
          key={stat.key}
          className={cn(
            'min-w-[92px] flex-1 rounded-xl px-4 py-3',
            stat.tone ? TONE_CLASS[stat.tone] : 'bg-card ring-1 ring-inset ring-border',
          )}
        >
          <span
            className={cn(
              'block text-[11px] font-medium uppercase tracking-wide',
              !stat.tone && 'text-muted-foreground',
            )}
          >
            {stat.label}
          </span>
          <span className={cn('font-mono text-[26px] leading-tight', !stat.tone && 'text-foreground/70')}>
            {stat.value}
          </span>
        </div>
      ))}

      <div className="flex flex-[1.6] min-w-[220px] flex-col justify-center gap-2 rounded-xl bg-card px-4 py-2.5 ring-1 ring-inset ring-border">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <Switch checked={showOnlyDifferences} onCheckedChange={onShowOnlyDifferencesChange} />
          {t('compare.showOnlyDifferences')}
        </label>
        <div className="flex items-center gap-0.5 self-start rounded-lg bg-muted/60 p-[3px] text-xs font-medium">
          {showTreeOption && (
            <button
              onClick={() => onViewChange('tree')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1',
                view === 'tree' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground',
              )}
            >
              <LayoutGrid className="h-3 w-3" />
              {t('compare.view.tree')}
            </button>
          )}
          <button
            onClick={() => onViewChange('table')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1',
              view === 'table' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground',
            )}
          >
            <TableProperties className="h-3 w-3" />
            {t('compare.view.table')}
          </button>
          <button
            onClick={() => onViewChange('side-by-side')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1',
              view === 'side-by-side' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground',
            )}
          >
            <GitCompareArrows className="h-3 w-3" />
            {t('compare.view.sideBySide')}
          </button>
        </div>
      </div>
    </div>
  )
}
