import { Search, SlidersHorizontal } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { FileDropZone } from '@/components/file-drop-zone'
import { LoadProgressBar } from '@/components/load-progress-bar'
import { PathPicker } from '@/components/path-picker'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useTableDocument } from '@/hooks/use-table-document'
import { useTranslation } from '@/i18n'
import { formatBytes } from '@/lib/big-file'
import { downloadBlob, downloadTextFile } from '@/lib/download-file'
import { parseJsonPath } from '@/lib/json-path'
import { resolveColumnOrder, type TableQuery, type TableQueryResult } from '@/lib/table-query'
import { rowsToCsv, rowsToJson, rowsToMarkdown, rowsToSheetData } from '@/lib/table-export'
import { useTabsStore } from '@/store/tabs-store'
import type { JsonPathSegment } from '@/types/json-doc'
import type { JsonValue } from '@/types/json'
import type { Tab } from '@/types/tabs'
import { CellValuePopup } from './cell-value-popup'
import { ColumnManager } from './column-manager'
import { DataTable } from './data-table'
import { TABLE_EXAMPLE_JSON } from './example'
import { ExportMenu } from './export-menu'
import { FilterChips } from './filter-chips'
import { PaginationBar } from './pagination-bar'

const QUERY_DEBOUNCE_MS = 300

function resolveRootSegments(label: string): JsonPathSegment[] {
  return parseJsonPath(label) ?? []
}

export function TablePane({ tab }: { tab: Tab<'table'> }) {
  const { t, locale } = useTranslation()
  const updateTabState = useTabsStore((s) => s.updateTabState)
  const doc = useTableDocument()

  const [page, setPage] = useState(0)
  const [queryResult, setQueryResult] = useState<TableQueryResult>({ rows: [], totalFiltered: 0 })
  const [cellValue, setCellValue] = useState<JsonValue | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const debouncedSearch = useDebouncedValue(tab.state.search, QUERY_DEBOUNCE_MS)
  const debouncedFilters = useDebouncedValue(tab.state.columnFilters, QUERY_DEBOUNCE_MS)

  function setState(updater: (s: Tab<'table'>['state']) => Tab<'table'>['state']) {
    updateTabState<'table'>(tab.id, updater)
  }

  useEffect(() => {
    doc.reset()
    setPage(0)
    setQueryResult({ rows: [], totalFiltered: 0 })
    setCellValue(null)
    if (tab.state.input.trim() !== '') {
      void doc.loadText(tab.state.input, resolveRootSegments(tab.state.rootPath), tab.state.flattenDepth)
    }
    // Re-initializes whenever the active tab changes; `doc`'s own docId-guard protects
    // against a stale load resolving after the tab (or its content) changed again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab.id])

  useEffect(() => {
    setPage(0)
  }, [debouncedSearch, debouncedFilters, tab.state.sortColumn, tab.state.sortDir, tab.state.pageSize])

  const query: TableQuery = useMemo(
    () => ({
      sortColumn: tab.state.sortColumn,
      sortDir: tab.state.sortDir,
      search: debouncedSearch,
      columnFilters: debouncedFilters,
      offset: page * tab.state.pageSize,
      limit: tab.state.pageSize,
    }),
    [tab.state.sortColumn, tab.state.sortDir, debouncedSearch, debouncedFilters, page, tab.state.pageSize],
  )

  useEffect(() => {
    if (doc.status !== 'ready') return
    let cancelled = false
    void doc.queryRows(query).then((result) => {
      if (!cancelled) setQueryResult(result)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.status, doc.meta, query])

  const pageCount = Math.max(1, Math.ceil(queryResult.totalFiltered / tab.state.pageSize))
  useEffect(() => {
    if (page > 0 && page >= pageCount) setPage(pageCount - 1)
  }, [page, pageCount])

  async function loadFile(file: File) {
    setState((s) => ({ ...s, input: '' }))
    await doc.loadFile(file, resolveRootSegments(tab.state.rootPath), tab.state.flattenDepth)
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText()
      if (!text) {
        toast.message(t('jsonInput.clipboardEmpty'))
        return
      }
      setState((s) => ({ ...s, input: text }))
      await doc.loadText(text, resolveRootSegments(tab.state.rootPath), tab.state.flattenDepth)
    } catch {
      toast.error(t('jsonInput.pasteError'))
    }
  }

  async function loadExample() {
    setState((s) => ({ ...s, input: TABLE_EXAMPLE_JSON, rootPath: '$.users' }))
    await doc.loadText(TABLE_EXAMPLE_JSON, ['users'], tab.state.flattenDepth)
  }

  function reset() {
    doc.reset()
    setState((s) => ({ ...s, input: '' }))
  }

  async function onRootPathChange(label: string) {
    setState((s) => ({ ...s, rootPath: label }))
    await doc.setRootAndDepth(resolveRootSegments(label), tab.state.flattenDepth)
  }

  async function onFlattenDepthChange(depth: number) {
    setState((s) => ({ ...s, flattenDepth: depth }))
    await doc.setRootAndDepth(resolveRootSegments(tab.state.rootPath), depth)
  }

  async function fetchAllFilteredRows() {
    const total = queryResult.totalFiltered
    if (total === 0) return []
    const result = await doc.queryRows({ ...query, offset: 0, limit: total })
    return result.rows
  }

  const visibleColumns = useMemo(() => {
    if (!doc.meta) return []
    const order = resolveColumnOrder(doc.meta.columns, tab.state.columnOrder)
    const byKey = new Map(doc.meta.columns.map((c) => [c.key, c]))
    return order.filter((k) => !tab.state.hiddenColumns.includes(k)).map((k) => byKey.get(k)!)
  }, [doc.meta, tab.state.columnOrder, tab.state.hiddenColumns])

  async function exportAs(format: 'csv' | 'markdown' | 'json') {
    const rows = await fetchAllFilteredRows()
    if (format === 'csv') downloadTextFile('table.csv', rowsToCsv(visibleColumns, rows), 'text/csv;charset=utf-8')
    else if (format === 'markdown') downloadTextFile('table.md', rowsToMarkdown(visibleColumns, rows), 'text/markdown;charset=utf-8')
    else downloadTextFile('table.json', rowsToJson(visibleColumns, rows), 'application/json;charset=utf-8')
  }

  async function exportXlsx() {
    const rows = await fetchAllFilteredRows()
    const sheet = XLSX.utils.json_to_sheet(rowsToSheetData(visibleColumns, rows), {
      header: visibleColumns.map((c) => c.key),
    })
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, sheet, 'Table')
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
    downloadBlob('table.xlsx', new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
  }

  const isEmpty = doc.status === 'idle'

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
          {doc.status === 'error' ? t('table.error', { message: doc.error ?? '' }) : t('table.cancelled')}
        </p>
        <Button variant="outline" size="sm" onClick={reset}>
          {t('table.loadNew')}
        </Button>
      </div>
    )
  }

  const meta = doc.meta
  if (!meta) return null

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-2.5 px-4 pb-3 pt-3.5">
        <PathPicker
          paths={doc.paths}
          value={tab.state.rootPath}
          onChange={(v) => void onRootPathChange(v)}
          className="h-[34px] rounded-lg"
        />
        <Popover>
          <PopoverTrigger asChild>
            <button
              title={t('table.flattenDepth')}
              className="flex h-[34px] shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs text-muted-foreground hover:bg-accent"
            >
              <SlidersHorizontal className="h-3 w-3" />
              {t('table.flattenDepth')}: {tab.state.flattenDepth}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 p-3">
            <label className="mb-2 block text-xs text-muted-foreground">
              {t('table.flattenDepth')}: {tab.state.flattenDepth}
            </label>
            <Slider
              min={0}
              max={6}
              step={1}
              value={[tab.state.flattenDepth]}
              onValueChange={([v]) => void onFlattenDepthChange(v)}
            />
          </PopoverContent>
        </Popover>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={tab.state.search}
            onChange={(e) => setState((s) => ({ ...s, search: e.target.value }))}
            placeholder={t('table.search')}
            className="h-[34px] w-[220px] rounded-lg border border-border bg-transparent pl-8 pr-3 text-xs outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <FilterChips
          columns={meta.columns}
          filters={tab.state.columnFilters}
          onFiltersChange={(filters) => setState((s) => ({ ...s, columnFilters: filters }))}
        />
        <div className="ml-auto flex flex-wrap items-center gap-2.5">
          <ColumnManager
            columns={meta.columns}
            hiddenColumns={tab.state.hiddenColumns}
            onHiddenColumnsChange={(hidden) => setState((s) => ({ ...s, hiddenColumns: hidden }))}
            pinFirstColumn={tab.state.pinFirstColumn}
            onPinFirstColumnChange={(v) => setState((s) => ({ ...s, pinFirstColumn: v }))}
          />
          <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">
            {t('table.filteredRows', { filtered: queryResult.totalFiltered, total: meta.totalRows })} ·{' '}
            {formatBytes(meta.byteSize, locale)}
          </span>
          <ExportMenu onExport={(f) => void exportAs(f)} onExportXlsx={() => void exportXlsx()} />
          <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
            {t('table.loadNew')}
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
          {t('table.notArray')}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-hidden px-4 pb-4">
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl bg-card ring-1 ring-inset ring-border">
            <DataTable
              columns={meta.columns}
              rows={queryResult.rows}
              columnOrder={tab.state.columnOrder}
              onColumnOrderChange={(order) => setState((s) => ({ ...s, columnOrder: order }))}
              hiddenColumns={tab.state.hiddenColumns}
              pinFirstColumn={tab.state.pinFirstColumn}
              sortColumn={tab.state.sortColumn}
              sortDir={tab.state.sortDir}
              onSortChange={(column, dir) => setState((s) => ({ ...s, sortColumn: column, sortDir: dir }))}
              onCellClick={setCellValue}
              noRows={queryResult.rows.length === 0}
            />
            <PaginationBar
              page={page}
              pageCount={pageCount}
              totalFiltered={queryResult.totalFiltered}
              totalRows={meta.totalRows}
              pageSize={tab.state.pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => setState((s) => ({ ...s, pageSize: size }))}
            />
          </div>
        </div>
      )}
      <CellValuePopup value={cellValue} onClose={() => setCellValue(null)} />
    </div>
  )
}
