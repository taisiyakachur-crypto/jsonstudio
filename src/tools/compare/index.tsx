import { useEffect, useMemo, useState } from 'react'
import { useDiff } from '@/hooks/use-diff'
import { useTranslation } from '@/i18n'
import { flattenDiff } from '@/lib/diff'
import { validateJson } from '@/lib/validate-json'
import { useTabsStore } from '@/store/tabs-store'
import type { CompareTabState, Tab } from '@/types/tabs'
import { ComparePanel } from './compare-panel'
import { DiffOptionsPanel } from './diff-options-panel'
import { DiffSummaryBar } from './diff-summary-bar'
import { DiffTableView } from './diff-table-view'
import { DiffTreeView } from './diff-tree-view'
import { COMPARE_EXAMPLE_LEFT, COMPARE_EXAMPLE_RIGHT } from './example'

const DIFF_DEBOUNCE_MS = 400

export function ComparePane({ tab }: { tab: Tab<'compare'> }) {
  const { t } = useTranslation()
  const updateTabState = useTabsStore((s) => s.updateTabState)
  const diff = useDiff()

  const [panelModes, setPanelModes] = useState<Array<'small' | 'big'>>(['small', 'small'])

  const [left, right] = tab.state.panels

  function updatePanel(index: number, patch: Partial<CompareTabState['panels'][number]>) {
    updateTabState<'compare'>(tab.id, (s) => ({
      ...s,
      panels: s.panels.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    }))
  }

  function setOptions(options: CompareTabState['options']) {
    updateTabState<'compare'>(tab.id, (s) => ({ ...s, options }))
  }
  function setView(view: 'tree' | 'table') {
    updateTabState<'compare'>(tab.id, (s) => ({ ...s, view }))
  }
  function setShowOnlyDifferences(value: boolean) {
    updateTabState<'compare'>(tab.id, (s) => ({ ...s, showOnlyDifferences: value }))
  }

  const bothSmall = panelModes[0] === 'small' && panelModes[1] === 'small'
  const leftValid = useMemo(
    () =>
      Boolean(left?.text.trim()) &&
      validateJson(left?.text ?? '', left?.softMode ?? false, 'uk').valid,
    [left?.text, left?.softMode],
  )
  const rightValid = useMemo(
    () =>
      Boolean(right?.text.trim()) &&
      validateJson(right?.text ?? '', right?.softMode ?? false, 'uk').valid,
    [right?.text, right?.softMode],
  )
  const bothValid = leftValid && rightValid

  useEffect(() => {
    if (!bothSmall || !bothValid || !left || !right) return
    const timer = setTimeout(() => {
      diff.run(left.text, right.text, tab.state.options)
    }, DIFF_DEBOUNCE_MS)
    return () => clearTimeout(timer)
    // diff.run is stable (useCallback with no deps); text/options are the real triggers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left?.text, right?.text, tab.state.options, bothSmall, bothValid])

  const tableRows = useMemo(
    () => (diff.result ? flattenDiff(diff.result, tab.state.showOnlyDifferences) : []),
    [diff.result, tab.state.showOnlyDifferences],
  )

  if (!left || !right) return null

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex h-56 shrink-0 gap-px overflow-hidden bg-border">
        <ComparePanel
          panel={left}
          onTextChange={(text) => updatePanel(0, { text })}
          onSoftModeChange={(softMode) => updatePanel(0, { softMode })}
          onTitleChange={(title) => updatePanel(0, { title })}
          onModeChange={(mode) => setPanelModes((m) => [mode, m[1]!])}
          onLoadExample={() => updatePanel(0, { text: COMPARE_EXAMPLE_LEFT })}
        />
        <ComparePanel
          panel={right}
          onTextChange={(text) => updatePanel(1, { text })}
          onSoftModeChange={(softMode) => updatePanel(1, { softMode })}
          onTitleChange={(title) => updatePanel(1, { title })}
          onModeChange={(mode) => setPanelModes((m) => [m[0]!, mode])}
          onLoadExample={() => updatePanel(1, { text: COMPARE_EXAMPLE_RIGHT })}
        />
      </div>

      <DiffOptionsPanel options={tab.state.options} onChange={setOptions} />

      <div className="flex min-h-0 flex-1 flex-col">
        {!bothSmall ? (
          <p className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
            {t('compare.bigFileNotSupported')}
          </p>
        ) : !bothValid ? (
          <p className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
            {!left.text.trim() || !right.text.trim() ? t('compare.empty') : t('compare.invalid')}
          </p>
        ) : diff.status === 'running' ? (
          <p className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
            {diff.phase ? t(`compare.progress.${diff.phase}`) : '…'}
          </p>
        ) : diff.status === 'error' ? (
          <p className="flex flex-1 items-center justify-center p-8 text-center text-sm text-destructive">
            {t('compare.error', { message: diff.error ?? '' })}
          </p>
        ) : diff.status === 'cancelled' ? (
          <p className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
            {t('compare.cancelled')}
          </p>
        ) : diff.result ? (
          <>
            <DiffSummaryBar
              counts={diff.result.counts}
              view={tab.state.view === 'table' ? 'table' : 'tree'}
              onViewChange={setView}
              showOnlyDifferences={tab.state.showOnlyDifferences}
              onShowOnlyDifferencesChange={setShowOnlyDifferences}
            />
            {tab.state.view === 'table' ? (
              <DiffTableView rows={tableRows} className="min-h-0 flex-1" />
            ) : (
              <DiffTreeView root={diff.result} className="min-h-0 flex-1" />
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
