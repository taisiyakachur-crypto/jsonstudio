import { Plus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ExportBar, type ExportFormat } from '@/components/export-bar'
import { useDiff } from '@/hooks/use-diff'
import { useNWayDiff } from '@/hooks/use-n-way-diff'
import { useTranslation } from '@/i18n'
import { flattenDiff } from '@/lib/diff'
import { buildNWayRows, summarizeNWayRows } from '@/lib/diff-n-way'
import { exportDiffToCsv, exportDiffToMarkdown, nWayRowsToExportable } from '@/lib/diff-export'
import { validateJson } from '@/lib/validate-json'
import { useTabsStore } from '@/store/tabs-store'
import type { CompareTabState, ComparePanelState, Tab } from '@/types/tabs'
import { CompareEditDialog } from './compare-edit-dialog'
import { CompareSourceChip } from './compare-source-chip'
import { DiffOptionsPanel } from './diff-options-panel'
import { DiffSummaryBar, type CompareView, type SummaryStat } from './diff-summary-bar'
import { DiffTableView } from './diff-table-view'
import { DiffTreeView } from './diff-tree-view'
import { COMPARE_EXAMPLE_LEFT, COMPARE_EXAMPLE_RIGHT } from './example'
import { NWayTableView } from './n-way-table-view'
import { SideBySideView } from './side-by-side-view'

const DIFF_DEBOUNCE_MS = 400
const MAX_PANELS = 10
const MIN_PANELS = 2

function makePanel(index: number): ComparePanelState {
  return { id: crypto.randomUUID(), title: `JSON ${index + 1}`, text: '', softMode: false }
}

export function ComparePane({ tab }: { tab: Tab<'compare'> }) {
  const { t } = useTranslation()
  const updateTabState = useTabsStore((s) => s.updateTabState)
  const diff = useDiff()
  const nWayDiff = useNWayDiff()

  const panels = tab.state.panels
  const [panelModes, setPanelModes] = useState<Array<'small' | 'big'>>(() => panels.map(() => 'small'))
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  function updatePanel(index: number, patch: Partial<ComparePanelState>) {
    updateTabState<'compare'>(tab.id, (s) => ({
      ...s,
      panels: s.panels.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    }))
  }

  function addPanel() {
    if (panels.length >= MAX_PANELS) return
    const newIndex = panels.length
    updateTabState<'compare'>(tab.id, (s) => ({ ...s, panels: [...s.panels, makePanel(s.panels.length)] }))
    setPanelModes((m) => [...m, 'small'])
    setEditingIndex(newIndex)
  }

  function removePanel(index: number) {
    if (panels.length <= MIN_PANELS) return
    updateTabState<'compare'>(tab.id, (s) => ({ ...s, panels: s.panels.filter((_, i) => i !== index) }))
    setPanelModes((m) => m.filter((_, i) => i !== index))
  }

  function setOptions(options: CompareTabState['options']) {
    updateTabState<'compare'>(tab.id, (s) => ({ ...s, options }))
  }
  function setView(view: CompareView) {
    updateTabState<'compare'>(tab.id, (s) => ({ ...s, view }))
  }
  function setShowOnlyDifferences(value: boolean) {
    updateTabState<'compare'>(tab.id, (s) => ({ ...s, showOnlyDifferences: value }))
  }

  // Memoized (rather than inline in JSX): JsonInput's onModeChange feeds a useEffect there, so a
  // callback that's a new reference every render would re-fire that effect every render too --
  // each firing updates state, which triggers a re-render, which creates a new callback again,
  // forever. Bailing out in setPanelModes when nothing actually changed guards the same case for
  // any other caller.
  const handleEditingModeChange = useCallback(
    (mode: 'small' | 'big') => {
      if (editingIndex === null) return
      setPanelModes((m) => (m[editingIndex] === mode ? m : m.map((mm, i) => (i === editingIndex ? mode : mm))))
    },
    [editingIndex],
  )

  const allSmall = panelModes.every((m) => m === 'small')
  const panelValid = useMemo(
    () => panels.map((p) => Boolean(p.text.trim()) && validateJson(p.text, p.softMode, 'uk').valid),
    [panels],
  )
  const allValid = panelValid.every(Boolean)
  const isPairwise = panels.length === 2

  useEffect(() => {
    if (!allSmall || !allValid) return
    const timer = setTimeout(() => {
      const texts = panels.map((p) => p.text)
      if (isPairwise) diff.run(texts[0]!, texts[1]!, tab.state.options)
      else nWayDiff.run(texts, tab.state.options)
    }, DIFF_DEBOUNCE_MS)
    return () => clearTimeout(timer)
    // diff/nWayDiff.run are stable (useCallback, no deps); panels/options are the real triggers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panels, tab.state.options, allSmall, allValid, isPairwise])

  const activeStatus = isPairwise ? diff.status : nWayDiff.status
  const pairwiseResults = useMemo(
    () => (isPairwise ? (diff.result ? [diff.result] : null) : nWayDiff.results),
    [isPairwise, diff.result, nWayDiff.results],
  )

  const nWayRows = useMemo(
    () => (pairwiseResults ? buildNWayRows(pairwiseResults, panels.length) : []),
    [pairwiseResults, panels.length],
  )

  const effectiveView: CompareView =
    tab.state.view === 'side-by-side'
      ? 'side-by-side'
      : tab.state.view === 'tree' && isPairwise
        ? 'tree'
        : 'table'

  const stats: SummaryStat[] = isPairwise
    ? diff.result
      ? [
          { key: 'added', label: t('compare.summary.added'), value: diff.result.counts.added, tone: 'success' },
          { key: 'removed', label: t('compare.summary.removed'), value: diff.result.counts.removed, tone: 'destructive' },
          { key: 'changed', label: t('compare.summary.changed'), value: diff.result.counts.changed, tone: 'warning' },
          { key: 'same', label: t('compare.summary.same'), value: diff.result.counts.same },
        ]
      : []
    : (() => {
        const s = summarizeNWayRows(nWayRows)
        return [
          { key: 'differs', label: t('compare.summary.changed'), value: s.differs, tone: 'warning' as const },
          { key: 'same', label: t('compare.summary.same'), value: s.same },
        ]
      })()

  const panelTitles = panels.map((p, i) => p.title || `JSON ${i + 1}`)
  const filteredNWayRows = tab.state.showOnlyDifferences
    ? nWayRows.filter((r) => r.overallStatus === 'differs')
    : nWayRows

  const exportFormats: ExportFormat[] = pairwiseResults
    ? [
        {
          id: 'md',
          label: t('compare.export.markdown'),
          filename: 'diff.md',
          mimeType: 'text/markdown',
          getContent: () => exportDiffToMarkdown(nWayRowsToExportable(filteredNWayRows), panelTitles),
        },
        {
          id: 'csv',
          label: t('compare.export.csv'),
          filename: 'diff.csv',
          mimeType: 'text/csv',
          getContent: () => exportDiffToCsv(nWayRowsToExportable(filteredNWayRows), panelTitles),
        },
      ]
    : []

  const editingPanel = editingIndex !== null ? (panels[editingIndex] ?? null) : null

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center gap-2.5 px-4 pb-3 pt-3.5">
        {panels.map((panel, index) => (
          <CompareSourceChip key={panel.id} panel={panel} onEdit={() => setEditingIndex(index)} />
        ))}
        <button
          onClick={addPanel}
          disabled={panels.length >= MAX_PANELS}
          title={panels.length >= MAX_PANELS ? t('compare.maxPanelsReached') : t('compare.addPanel')}
          className="flex h-[34px] shrink-0 items-center gap-1.5 rounded-lg border border-dashed border-border px-3 text-xs text-muted-foreground hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('compare.addPanel')}
        </button>
        <div className="ml-auto">
          <DiffOptionsPanel options={tab.state.options} onChange={setOptions} />
        </div>
      </div>

      <CompareEditDialog
        panel={editingPanel}
        open={editingIndex !== null}
        onOpenChange={(open) => !open && setEditingIndex(null)}
        onTextChange={(text) => editingIndex !== null && updatePanel(editingIndex, { text })}
        onSoftModeChange={(softMode) => editingIndex !== null && updatePanel(editingIndex, { softMode })}
        onTitleChange={(title) => editingIndex !== null && updatePanel(editingIndex, { title })}
        onModeChange={handleEditingModeChange}
        onLoadExample={
          editingIndex === 0 || editingIndex === 1
            ? () => editingIndex !== null && updatePanel(editingIndex, { text: editingIndex === 0 ? COMPARE_EXAMPLE_LEFT : COMPARE_EXAMPLE_RIGHT })
            : undefined
        }
        onRemove={
          editingIndex !== null && panels.length > MIN_PANELS ? () => removePanel(editingIndex) : undefined
        }
      />

      <div className="flex min-h-0 flex-1 flex-col">
        {!allSmall ? (
          <p className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
            {t('compare.bigFileNotSupported')}
          </p>
        ) : !allValid ? (
          <p className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
            {panels.some((p) => !p.text.trim()) ? t('compare.empty') : t('compare.invalid')}
          </p>
        ) : activeStatus === 'running' ? (
          <p className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
            {isPairwise
              ? diff.phase
                ? t(`compare.progress.${diff.phase}`)
                : '…'
              : t('compare.progress.nWay', { completed: nWayDiff.completed, total: nWayDiff.total })}
          </p>
        ) : activeStatus === 'error' ? (
          <p className="flex flex-1 items-center justify-center p-8 text-center text-sm text-destructive">
            {t('compare.error', { message: (isPairwise ? diff.error : nWayDiff.error) ?? '' })}
          </p>
        ) : activeStatus === 'cancelled' ? (
          <p className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
            {t('compare.cancelled')}
          </p>
        ) : pairwiseResults ? (
          <>
            <DiffSummaryBar
              stats={stats}
              view={effectiveView}
              onViewChange={setView}
              showTreeOption={isPairwise}
              showOnlyDifferences={tab.state.showOnlyDifferences}
              onShowOnlyDifferencesChange={setShowOnlyDifferences}
            />
            <div className="min-h-0 flex-1 overflow-hidden px-4 pb-4">
              <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl bg-card ring-1 ring-inset ring-border">
                <div className="flex shrink-0 items-center justify-end border-b border-border/60 px-3 py-2">
                  <ExportBar formats={exportFormats} />
                </div>
                {effectiveView === 'side-by-side' ? (
                  <SideBySideView rows={filteredNWayRows} panelTitles={panelTitles} className="min-h-0 flex-1" />
                ) : effectiveView === 'tree' && diff.result ? (
                  <DiffTreeView root={diff.result} className="min-h-0 flex-1" />
                ) : isPairwise && diff.result ? (
                  <DiffTableView
                    rows={flattenDiff(diff.result, tab.state.showOnlyDifferences)}
                    className="min-h-0 flex-1"
                  />
                ) : (
                  <NWayTableView rows={filteredNWayRows} panelTitles={panelTitles} className="min-h-0 flex-1" />
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
