import { BarChart3, Clipboard, FolderOpen, GitCompare, Table2, UploadCloud, Wand2 } from 'lucide-react'
import { COMPARE_EXAMPLE_LEFT, COMPARE_EXAMPLE_RIGHT } from '@/tools/compare/example'
import { CHART_EXAMPLE_JSON } from '@/tools/chart/example'
import { TABLE_EXAMPLE_JSON } from '@/tools/table/example'
import { useTranslation } from '@/i18n'
import { useTabsStore } from '@/store/tabs-store'
import { cn } from '@/lib/utils'

/**
 * The very first thing a new user sees: a single centered hero (drop/paste/choose-file) instead
 * of Format's usual split input/result layout, plus example cards for every tool -- picking one
 * opens (or fills) that tool's own tab, rather than always landing on Format's example.
 * Shown only in place of a lone, still-empty Format tab (see `format/index.tsx`).
 */
export function FirstLaunchScreen({
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onChooseFile,
  onPasteClipboard,
  onLoadFormatExample,
}: {
  dragOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
  onChooseFile: () => void
  onPasteClipboard: () => void
  onLoadFormatExample: () => void
}) {
  const { t } = useTranslation()
  const addTab = useTabsStore((s) => s.addTab)
  const updateTabState = useTabsStore((s) => s.updateTabState)

  function loadCompareExample() {
    const newId = addTab('compare')
    updateTabState<'compare'>(newId, (s) => ({
      ...s,
      panels: s.panels.map((p, i) =>
        i === 0 ? { ...p, text: COMPARE_EXAMPLE_LEFT } : i === 1 ? { ...p, text: COMPARE_EXAMPLE_RIGHT } : p,
      ),
    }))
  }

  function loadTableExample() {
    const newId = addTab('table')
    updateTabState<'table'>(newId, (s) => ({ ...s, input: TABLE_EXAMPLE_JSON, rootPath: '$.users' }))
  }

  function loadChartExample() {
    const newId = addTab('chart')
    updateTabState<'chart'>(newId, (s) => ({
      ...s,
      input: CHART_EXAMPLE_JSON,
      dataPath: '$.sales',
      xField: 'month',
      yFields: ['revenue'],
      groupBy: 'region',
      aggregation: 'sum',
    }))
  }

  const cards = [
    {
      icon: Wand2,
      title: t('firstLaunch.cards.format.title'),
      subtitle: t('firstLaunch.cards.format.subtitle'),
      onClick: onLoadFormatExample,
    },
    {
      icon: GitCompare,
      title: t('firstLaunch.cards.compare.title'),
      subtitle: t('firstLaunch.cards.compare.subtitle'),
      onClick: loadCompareExample,
    },
    {
      icon: Table2,
      title: t('firstLaunch.cards.table.title'),
      subtitle: t('firstLaunch.cards.table.subtitle'),
      onClick: loadTableExample,
    },
    {
      icon: BarChart3,
      title: t('firstLaunch.cards.chart.title'),
      subtitle: t('firstLaunch.cards.chart.subtitle'),
      onClick: loadChartExample,
    },
  ]

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto px-8 py-8">
      <div className="max-w-lg text-center">
        <h2 className="mb-1.5 text-[28px] font-medium tracking-tight">{t('firstLaunch.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('firstLaunch.subtitle')}</p>
      </div>

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          'flex w-full max-w-[720px] flex-col items-center gap-3 rounded-2xl border-[1.5px] border-dashed p-8 text-center transition-colors',
          dragOver ? 'border-primary bg-primary/10' : 'border-primary/40 bg-gradient-to-b from-primary/[0.06] to-transparent',
        )}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
          <UploadCloud className="h-[22px] w-[22px]" />
        </span>
        <p className="text-[15px] font-medium">{t('firstLaunch.dropzone.title')}</p>
        <p className="text-xs text-muted-foreground">{t('firstLaunch.dropzone.formats')}</p>
        <div className="mt-1.5 flex gap-2">
          <button
            onClick={onChooseFile}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            <FolderOpen className="h-[15px] w-[15px]" />
            {t('common.chooseFile')}
          </button>
          <button
            onClick={onPasteClipboard}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3.5 text-[13px] font-medium hover:bg-accent"
          >
            <Clipboard className="h-[15px] w-[15px]" />
            {t('common.pasteClipboard')}
          </button>
        </div>
      </div>

      <div className="w-full max-w-[900px]">
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t('firstLaunch.examplesLabel')}
        </p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {cards.map((card) => (
            <button
              key={card.title}
              onClick={card.onClick}
              className="flex flex-col items-start gap-1.5 rounded-xl bg-card p-3.5 text-left ring-1 ring-inset ring-border hover:ring-primary/40"
            >
              <card.icon className="h-[17px] w-[17px] text-primary" />
              <span className="text-[13px] font-medium">{card.title}</span>
              <span className="text-[11px] text-muted-foreground">{card.subtitle}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
