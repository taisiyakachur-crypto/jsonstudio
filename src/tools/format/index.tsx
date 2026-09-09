import { useMemo, useState } from 'react'
import { BigFileBanner } from '@/components/big-file-banner'
import { JsonTree } from '@/components/json-tree'
import { useJsonInputState } from '@/components/json-input/use-json-input-state'
import { LoadProgressBar } from '@/components/load-progress-bar'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/i18n'
import { formatBytes, PREVIEW_LINE_COUNT } from '@/lib/big-file'
import { indentUnit as indentUnitFor } from '@/lib/format-json'
import { computeJsonStats } from '@/lib/json-stats'
import { repairJsonTracked, type PathSegment } from '@/lib/repair-json-tracked'
import { sortJsonKeysDeep } from '@/lib/sort-json-keys'
import { stringifyWithHighlights } from '@/lib/stringify-with-highlights'
import { useTabsStore } from '@/store/tabs-store'
import type { FormatSidebarTab, Tab } from '@/types/tabs'
import type { JsonValue } from '@/types/json'
import { FirstLaunchScreen } from '@/app/first-launch-screen'
import { FORMAT_EXAMPLE_JSON } from './example'
import { FormatInputPanel } from './format-input-panel'
import { FormatResultPanel, type ResultView } from './format-result-panel'

export function FormatPane({ tab }: { tab: Tab<'format'> }) {
  const { t, locale } = useTranslation()
  const updateTabState = useTabsStore((s) => s.updateTabState)
  const tabCount = useTabsStore((s) => s.tabs.length)
  const [resultView, setResultView] = useState<ResultView>('code')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [minified, setMinified] = useState(false)
  const [sortKeys, setSortKeys] = useState(false)

  function setInput(input: string) {
    updateTabState<'format'>(tab.id, (s) => ({ ...s, input }))
  }
  function setSoftMode(softMode: boolean) {
    updateTabState<'format'>(tab.id, (s) => ({ ...s, softMode }))
  }
  function setSidebarTab(sidebarTab: FormatSidebarTab) {
    updateTabState<'format'>(tab.id, (s) => ({ ...s, sidebarTab }))
  }
  function setJsonPathQuery(jsonPathQuery: string) {
    updateTabState<'format'>(tab.id, (s) => ({ ...s, jsonPathQuery }))
  }
  function setSchemaInput(schemaInput: string) {
    updateTabState<'format'>(tab.id, (s) => ({ ...s, schemaInput }))
  }

  // Deliberately does NOT drive the input box -- Format never rewrites what's typed/pasted there,
  // only `useJsonInputState`'s file/paste/clear/big-file plumbing is reused.
  const state = useJsonInputState({
    value: tab.state.input,
    onChange: setInput,
    softMode: tab.state.softMode,
    formatIndent: tab.state.indent,
  })

  // The result is entirely derived from the raw input: validate as typed, and only if that fails
  // fall back to a tracked repair (which never deletes anything -- a missing value is completed
  // with `null` and reported so it can be highlighted, never silently dropped).
  const repairResult = useMemo((): { value: JsonValue | null; syntheticPaths: PathSegment[][] } => {
    if (state.validation.valid && state.validation.value !== undefined) {
      return { value: state.validation.value, syntheticPaths: [] }
    }
    const repaired = repairJsonTracked(state.debouncedValue)
    if (repaired) return { value: repaired.value, syntheticPaths: repaired.syntheticPaths }
    return { value: null, syntheticPaths: [] }
  }, [state.validation, state.debouncedValue])

  const finalValue = useMemo(
    () => (repairResult.value !== null && sortKeys ? sortJsonKeysDeep(repairResult.value) : repairResult.value),
    [repairResult.value, sortKeys],
  )

  const stats = useMemo(() => (finalValue !== null ? computeJsonStats(finalValue) : null), [finalValue])

  const { text: resultText, ranges: highlightRanges } = useMemo(() => {
    if (finalValue === null) return { text: '', ranges: [] }
    return stringifyWithHighlights(finalValue, repairResult.syntheticPaths, minified ? '' : indentUnitFor(tab.state.indent))
  }, [finalValue, repairResult.syntheticPaths, minified, tab.state.indent])

  const repaired = repairResult.syntheticPaths.length > 0

  function handleFormatKeepingInput() {
    setMinified(false)
    setSortKeys(false)
  }

  if (state.bigActive) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        {state.bigDoc.status === 'loading' && (
          <LoadProgressBar progress={state.bigDoc.progress} onCancel={state.bigDoc.cancel} />
        )}
        {(state.bigDoc.status === 'cancelled' || state.bigDoc.status === 'error') && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <p className="text-sm text-destructive">
              {state.bigDoc.status === 'error'
                ? t('format.error', { message: state.bigDoc.error ?? '' })
                : t('format.cancelled')}
            </p>
            <Button variant="outline" size="sm" onClick={() => state.setBigActive(false)}>
              {t('format.loadNew')}
            </Button>
          </div>
        )}
        {state.bigDoc.status === 'ready' && state.bigDoc.meta && (
          <>
            <BigFileBanner byteSize={state.bigDoc.meta.byteSize} />
            <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
              <span className="text-xs text-muted-foreground">
                {formatBytes(state.bigDoc.meta.byteSize, locale)} · {state.bigDoc.meta.rootType} ·{' '}
                {state.bigDoc.meta.rootChildCount ?? 0}
              </span>
              <Button variant="ghost" size="sm" onClick={() => state.setBigActive(false)}>
                {t('format.loadNew')}
              </Button>
            </div>
            <details className="shrink-0 border-b border-border">
              <summary className="cursor-pointer px-3 py-2 text-xs text-muted-foreground">
                {t('format.rawPreviewTitle', { lines: PREVIEW_LINE_COUNT })}
              </summary>
              <pre className="max-h-64 overflow-auto border-t border-border bg-muted/30 p-3 font-mono text-xs">
                {state.bigDoc.meta.previewText}
              </pre>
            </details>
            <JsonTree docId={state.bigDoc.meta.id} getChildren={state.bigDoc.getChildren} className="min-h-0 flex-1" />
          </>
        )}
      </div>
    )
  }

  if (tabCount === 1 && tab.state.input.trim() === '') {
    return (
      <FirstLaunchScreen
        dragOver={dragOver}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={state.handleDrop}
        onChooseFile={state.chooseFile}
        onPasteClipboard={() => void state.pasteFromClipboard()}
        onLoadFormatExample={() => setInput(FORMAT_EXAMPLE_JSON)}
      />
    )
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <FormatInputPanel
        value={tab.state.input}
        onChange={setInput}
        softMode={tab.state.softMode}
        onSoftModeChange={setSoftMode}
        onLoadExample={() => setInput(FORMAT_EXAMPLE_JSON)}
        state={state}
        minified={minified}
        sortKeys={sortKeys}
        onFormat={handleFormatKeepingInput}
        onToggleMinified={() => setMinified((m) => !m)}
        onToggleSortKeys={() => setSortKeys((s) => !s)}
      />
      <FormatResultPanel
        isEmpty={tab.state.input.trim() === ''}
        value={finalValue}
        repaired={repaired}
        errorMessage={state.validation.error?.message ?? null}
        resultText={resultText}
        highlightRanges={highlightRanges}
        stats={stats}
        view={resultView}
        onViewChange={setResultView}
        advancedOpen={advancedOpen}
        onAdvancedOpenChange={setAdvancedOpen}
        advancedTab={tab.state.sidebarTab === 'stats' ? 'jsonpath' : tab.state.sidebarTab}
        onAdvancedTabChange={setSidebarTab}
        jsonPathQuery={tab.state.jsonPathQuery}
        onJsonPathQueryChange={setJsonPathQuery}
        schemaInput={tab.state.schemaInput}
        onSchemaInputChange={setSchemaInput}
      />
    </div>
  )
}
