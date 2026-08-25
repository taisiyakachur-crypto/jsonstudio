import { AreaChart, BarChart3, Image, LineChart, PieChart, ScatterChart } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { FileDropZone } from '@/components/file-drop-zone'
import { LoadProgressBar } from '@/components/load-progress-bar'
import { PathPicker } from '@/components/path-picker'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useChartDocument } from '@/hooks/use-chart-document'
import { useTranslation } from '@/i18n'
import { formatBytes } from '@/lib/big-file'
import { type ChartKind, type ChartPoint } from '@/lib/chart-data'
import { exportSvgToPng } from '@/lib/export-chart-png'
import { parseJsonPath } from '@/lib/json-path'
import { useTabsStore } from '@/store/tabs-store'
import type { JsonPathSegment } from '@/types/json-doc'
import type { Tab } from '@/types/tabs'
import { ChartView } from './chart-view'
import { CHART_EXAMPLE_JSON } from './example'
import { FieldMultiSelect } from './field-multi-select'

const CHART_KINDS: ChartKind[] = ['bar', 'bar-stacked', 'line', 'area', 'pie', 'scatter']
const AGGREGATIONS: Tab<'chart'>['state']['aggregation'][] = ['none', 'sum', 'count', 'avg', 'min', 'max']
const CHART_KIND_ICON: Record<ChartKind, typeof BarChart3> = {
  bar: BarChart3,
  'bar-stacked': BarChart3,
  line: LineChart,
  area: AreaChart,
  pie: PieChart,
  scatter: ScatterChart,
}

function resolveRootSegments(label: string): JsonPathSegment[] {
  return parseJsonPath(label) ?? []
}

export function ChartPane({ tab }: { tab: Tab<'chart'> }) {
  const { t, locale } = useTranslation()
  const updateTabState = useTabsStore((s) => s.updateTabState)
  const doc = useChartDocument()

  const [result, setResult] = useState<{ data: ChartPoint[]; seriesKeys: string[] }>({ data: [], seriesKeys: [] })
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)

  async function savePng() {
    const svg = chartContainerRef.current?.querySelector('svg')
    if (!svg) return
    try {
      await exportSvgToPng(svg, 'chart.png')
    } catch {
      toast.error(t('chart.pngError'))
    }
  }

  function setState(updater: (s: Tab<'chart'>['state']) => Tab<'chart'>['state']) {
    updateTabState<'chart'>(tab.id, updater)
  }

  useEffect(() => {
    doc.reset()
    setResult({ data: [], seriesKeys: [] })
    if (tab.state.input.trim() !== '') {
      void doc.loadText(tab.state.input, resolveRootSegments(tab.state.dataPath))
    }
    // Re-initializes whenever the active tab changes; `doc`'s own docId-guard protects
    // against a stale load resolving after the tab (or its content) changed again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab.id])

  useEffect(() => {
    if (doc.status !== 'ready' || !doc.meta || tab.state.xField === '' || tab.state.yFields.length === 0) {
      setResult({ data: [], seriesKeys: [] })
      return
    }
    let cancelled = false
    void doc
      .computeChart(tab.state.xField, tab.state.yFields, tab.state.aggregation, tab.state.groupBy)
      .then((r) => {
        if (!cancelled) setResult(r)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.status, doc.meta, tab.state.xField, tab.state.yFields, tab.state.aggregation, tab.state.groupBy])

  useEffect(() => {
    if (!doc.meta) return
    const fields = new Set(doc.meta.fields)
    if (tab.state.xField && !fields.has(tab.state.xField)) {
      setState((s) => ({ ...s, xField: '' }))
    }
    if (tab.state.yFields.some((f) => !fields.has(f))) {
      setState((s) => ({ ...s, yFields: s.yFields.filter((f) => fields.has(f)) }))
    }
    if (tab.state.groupBy && !fields.has(tab.state.groupBy)) {
      setState((s) => ({ ...s, groupBy: '' }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.meta])

  async function loadFile(file: File) {
    setState((s) => ({ ...s, input: '' }))
    await doc.loadFile(file, resolveRootSegments(tab.state.dataPath))
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText()
      if (!text) {
        toast.message(t('jsonInput.clipboardEmpty'))
        return
      }
      setState((s) => ({ ...s, input: text }))
      await doc.loadText(text, resolveRootSegments(tab.state.dataPath))
    } catch {
      toast.error(t('jsonInput.pasteError'))
    }
  }

  async function loadExample() {
    setState((s) => ({
      ...s,
      input: CHART_EXAMPLE_JSON,
      dataPath: '$.sales',
      xField: 'month',
      yFields: ['revenue'],
      groupBy: 'region',
      aggregation: 'sum',
    }))
    await doc.loadText(CHART_EXAMPLE_JSON, ['sales'])
  }

  function reset() {
    doc.reset()
    setState((s) => ({ ...s, input: '' }))
  }

  async function onDataPathChange(label: string) {
    setState((s) => ({ ...s, dataPath: label }))
    await doc.setRoot(resolveRootSegments(label))
  }

  const isEmpty = doc.status === 'idle'

  const fieldTypes = useMemo(() => doc.meta?.fieldTypes ?? {}, [doc.meta])
  const fields = doc.meta?.fields ?? []

  if (isEmpty) {
    return (
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const file = e.dataTransfer.files[0]
          if (file) void loadFile(file)
        }}
        className="flex flex-1 flex-col items-center justify-center gap-4 p-8"
      >
        <FileDropZone accept="" onFile={(f) => void loadFile(f)} className="w-full max-w-xl" />
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void pasteFromClipboard()}>
            {t('common.pasteClipboard')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => void loadExample()}>
            {t('common.loadExample')}
          </Button>
        </div>
        {dragOver && (
          <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center border-2 border-dashed border-primary bg-primary/5 text-sm text-primary">
            {t('common.dropFile')}
          </div>
        )}
      </div>
    )
  }

  if (doc.status === 'loading') {
    return <LoadProgressBar progress={doc.progress} onCancel={doc.cancel} />
  }

  if (doc.status === 'cancelled' || doc.status === 'error') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm text-destructive">
          {doc.status === 'error' ? t('chart.error', { message: doc.error ?? '' }) : t('chart.cancelled')}
        </p>
        <Button variant="outline" size="sm" onClick={reset}>
          {t('chart.loadNew')}
        </Button>
      </div>
    )
  }

  const meta = doc.meta
  if (!meta) return null

  const KindIcon = CHART_KIND_ICON[tab.state.chartKind]

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-2.5 px-4 pb-0 pt-3.5">
        <PathPicker
          paths={doc.paths}
          value={tab.state.dataPath}
          onChange={(v) => void onDataPathChange(v)}
          className="h-[34px] rounded-lg"
        />

        {meta.rootResolved && (
          <>
            <Select
              value={tab.state.chartKind}
              onValueChange={(v) => setState((s) => ({ ...s, chartKind: v as ChartKind }))}
            >
              <SelectTrigger className="h-[34px] w-auto gap-2 rounded-lg border-border px-3 text-xs">
                <KindIcon className="h-3.5 w-3.5 text-primary" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHART_KINDS.map((kind) => (
                  <SelectItem key={kind} value={kind}>
                    {t(`chart.kind.${kind}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={tab.state.xField} onValueChange={(v) => setState((s) => ({ ...s, xField: v }))}>
              <SelectTrigger className="h-[34px] w-auto gap-1.5 rounded-lg border-border px-3 text-xs">
                <span className="text-muted-foreground/70">X</span>
                <SelectValue placeholder={t('chart.xField.placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {fields.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldMultiSelect
              fields={fields}
              fieldTypes={fieldTypes}
              value={tab.state.yFields}
              onChange={(yFields) => setState((s) => ({ ...s, yFields }))}
              placeholder={t('chart.yFields.placeholder')}
              label="Y"
              className="h-[34px] w-auto max-w-44 rounded-lg border-border"
            />
            <Select
              value={tab.state.aggregation}
              onValueChange={(v) => setState((s) => ({ ...s, aggregation: v as Tab<'chart'>['state']['aggregation'] }))}
            >
              <SelectTrigger className="h-[34px] w-auto gap-1.5 rounded-lg border-border px-3 text-xs">
                <span className="text-muted-foreground/70">·</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGGREGATIONS.map((agg) => (
                  <SelectItem key={agg} value={agg}>
                    {t(`chart.aggregation.${agg}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={tab.state.groupBy === '' ? '__none__' : tab.state.groupBy}
              onValueChange={(v) => setState((s) => ({ ...s, groupBy: v === '__none__' ? '' : v }))}
            >
              <SelectTrigger className="h-[34px] w-auto gap-1.5 rounded-lg border-border px-3 text-xs">
                <span className="text-muted-foreground/70">{t('chart.groupBy.label')}</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t('chart.groupBy.none')}</SelectItem>
                {fields.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}

        <div className="ml-auto flex items-center gap-2.5">
          <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">
            {formatBytes(meta.byteSize, locale)} · {meta.totalRows}
          </span>
          <button
            onClick={() => void savePng()}
            disabled={tab.state.xField === '' || tab.state.yFields.length === 0}
            className="flex h-[34px] shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
          >
            <Image className="h-3.5 w-3.5" />
            {t('chart.savePng')}
          </button>
          <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
            {t('chart.loadNew')}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void loadFile(file)
              e.target.value = ''
            }}
          />
        </div>
      </div>
      {!meta.rootResolved ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          {t('chart.notArray')}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-hidden p-4">
          <div
            ref={chartContainerRef}
            className="grid h-full grid-rows-[auto_1fr] overflow-hidden rounded-xl bg-card p-4 ring-1 ring-inset ring-border"
          >
            {tab.state.xField === '' || tab.state.yFields.length === 0 ? (
              <div className="row-span-2 flex items-center justify-center text-sm text-muted-foreground">
                {t('chart.noFields')}
              </div>
            ) : (
              <>
                <span className="mb-2 truncate text-sm font-medium text-muted-foreground">
                  {tab.state.yFields.join(', ')}
                </span>
                <div className="min-h-0 min-w-0">
                  <ChartView kind={tab.state.chartKind} data={result.data} seriesKeys={result.seriesKeys} />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
