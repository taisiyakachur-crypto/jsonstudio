import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FixedSizeList, type ListChildComponentProps } from 'react-window'
import { Input } from '@/components/ui/input'
import { useElementSize } from '@/hooks/use-element-size'
import { useTranslation } from '@/i18n'
import type { FlatRow } from '@/lib/flatten'
import { resolveColumnOrder, type ColumnMeta } from '@/lib/table-query'
import { cn } from '@/lib/utils'
import { isJsonArray, isJsonObject, type JsonValue } from '@/types/json'
import { ColumnTypeBadge } from '@/components/column-type-badge'

const COLUMN_WIDTH = 200
const ROW_HEIGHT = 32
const HEADER_ROW_HEIGHT = 30
const FILTER_ROW_HEIGHT = 30

const columnHelper = createColumnHelper<FlatRow>()

function cellPreview(value: JsonValue | undefined): string {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value
  if (isJsonArray(value)) return `[${value.length}]`
  if (isJsonObject(value)) return `{${Object.keys(value).length}}`
  return String(value)
}

export function DataTable({
  columns,
  rows,
  columnOrder,
  onColumnOrderChange,
  hiddenColumns,
  pinFirstColumn,
  sortColumn,
  sortDir,
  onSortChange,
  columnFilters,
  onColumnFiltersChange,
  onCellClick,
  noRows,
}: {
  columns: ColumnMeta[]
  rows: FlatRow[]
  columnOrder: string[]
  onColumnOrderChange: (order: string[]) => void
  hiddenColumns: string[]
  pinFirstColumn: boolean
  sortColumn: string | null
  sortDir: 'asc' | 'desc'
  onSortChange: (column: string | null, dir: 'asc' | 'desc') => void
  columnFilters: Record<string, string>
  onColumnFiltersChange: (filters: Record<string, string>) => void
  onCellClick: (value: JsonValue) => void
  noRows: boolean
}) {
  const { t } = useTranslation()
  const [containerRef, { width, height }] = useElementSize<HTMLDivElement>()
  const outerRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const pinnedBodyRef = useRef<HTMLDivElement>(null)
  const [dragKey, setDragKey] = useState<string | null>(null)

  const columnsByKey = useMemo(() => new Map(columns.map((c) => [c.key, c])), [columns])
  const orderedKeys = useMemo(() => resolveColumnOrder(columns, columnOrder), [columns, columnOrder])

  const visibleKeys = useMemo(
    () => orderedKeys.filter((k) => !hiddenColumns.includes(k)),
    [orderedKeys, hiddenColumns],
  )
  const pinnedKey = pinFirstColumn ? (visibleKeys[0] ?? null) : null
  const scrollKeys = useMemo(
    () => (pinnedKey ? visibleKeys.filter((k) => k !== pinnedKey) : visibleKeys),
    [visibleKeys, pinnedKey],
  )

  const columnVisibility: VisibilityState = useMemo(() => {
    const vis: VisibilityState = {}
    for (const key of orderedKeys) vis[key] = !hiddenColumns.includes(key)
    return vis
  }, [orderedKeys, hiddenColumns])

  const sorting: SortingState = sortColumn ? [{ id: sortColumn, desc: sortDir === 'desc' }] : []

  const columnDefs = useMemo(
    () =>
      orderedKeys.map((key) =>
        columnHelper.accessor((row) => row[key], {
          id: key,
          enableSorting: true,
        }),
      ),
    [orderedKeys],
  )

  const table = useReactTable({
    data: rows,
    columns: columnDefs,
    state: { columnVisibility, sorting },
    manualSorting: true,
    manualFiltering: true,
    manualPagination: true,
    enableMultiSort: false,
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      const first = next[0]
      onSortChange(first?.id ?? null, first?.desc ? 'desc' : 'asc')
    },
    getCoreRowModel: getCoreRowModel(),
  })

  useEffect(() => {
    const el = outerRef.current
    if (!el) return
    function sync() {
      if (!el) return
      if (headerRef.current) headerRef.current.scrollLeft = el.scrollLeft
      if (pinnedBodyRef.current) pinnedBodyRef.current.scrollTop = el.scrollTop
    }
    el.addEventListener('scroll', sync)
    return () => el.removeEventListener('scroll', sync)
    // Re-attaches once the outer scroll element actually exists: FixedSizeList (and its
    // outerRef) only mounts after useElementSize reports a non-zero size.
  }, [width, height])

  const scrollWidth = scrollKeys.length * COLUMN_WIDTH

  function handleDrop(targetKey: string) {
    if (!dragKey || dragKey === targetKey) {
      setDragKey(null)
      return
    }
    const next = [...orderedKeys]
    next.splice(next.indexOf(dragKey), 1)
    next.splice(next.indexOf(targetKey), 0, dragKey)
    onColumnOrderChange(next)
    setDragKey(null)
  }

  function setColumnFilter(key: string, value: string) {
    const next = { ...columnFilters }
    if (value === '') delete next[key]
    else next[key] = value
    onColumnFiltersChange(next)
  }

  function HeaderCell({ colKey }: { colKey: string }) {
    const meta = columnsByKey.get(colKey)
    const column = table.getColumn(colKey)
    const sorted = column?.getIsSorted()
    return (
      <div
        draggable
        onDragStart={() => setDragKey(colKey)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => handleDrop(colKey)}
        className="flex shrink-0 items-center gap-1 border-r border-border/60 px-1.5 text-xs font-medium"
        style={{ width: COLUMN_WIDTH }}
      >
        <GripVertical className="h-3 w-3 shrink-0 cursor-grab text-muted-foreground/50" />
        <button
          onClick={column?.getToggleSortingHandler()}
          className="flex min-w-0 flex-1 items-center gap-1 truncate text-left hover:text-foreground"
        >
          <span className="truncate">{colKey}</span>
          {sorted === 'asc' && <ArrowUp className="h-3 w-3 shrink-0" />}
          {sorted === 'desc' && <ArrowDown className="h-3 w-3 shrink-0" />}
        </button>
        {meta && <ColumnTypeBadge type={meta.type} />}
      </div>
    )
  }

  function FilterCell({ colKey }: { colKey: string }) {
    return (
      <div className="shrink-0 px-1 py-0.5" style={{ width: COLUMN_WIDTH }}>
        <Input
          value={columnFilters[colKey] ?? ''}
          onChange={(e) => setColumnFilter(colKey, e.target.value)}
          placeholder={t('table.column.filterPlaceholder')}
          className="h-6 px-1.5 text-xs"
        />
      </div>
    )
  }

  function BodyCell({ colKey, row }: { colKey: string; row: FlatRow }) {
    const value = row[colKey]
    const clickable = value !== undefined && value !== null && (isJsonObject(value) || isJsonArray(value))
    return (
      <div
        onClick={() => clickable && onCellClick(value)}
        className={cn(
          'flex shrink-0 items-center truncate px-2 font-mono text-xs',
          clickable && 'cursor-pointer text-primary hover:underline',
        )}
        style={{ width: COLUMN_WIDTH, height: ROW_HEIGHT }}
        title={cellPreview(value)}
      >
        {cellPreview(value)}
      </div>
    )
  }

  function ScrollRow({ index, style }: ListChildComponentProps) {
    const row = rows[index]
    if (!row) return null
    return (
      <div style={{ ...style, width: scrollWidth }} className="flex border-b border-border/60">
        {scrollKeys.map((key) => (
          <BodyCell key={key} colKey={key} row={row} />
        ))}
      </div>
    )
  }

  const listHeight = height - HEADER_ROW_HEIGHT - FILTER_ROW_HEIGHT
  const scrollAreaWidth = width - (pinnedKey ? COLUMN_WIDTH : 0)

  return (
    <div ref={containerRef} className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {pinnedKey && (
          <div className="flex shrink-0 flex-col border-r border-border">
            <div style={{ height: HEADER_ROW_HEIGHT }} className="flex">
              <HeaderCell colKey={pinnedKey} />
            </div>
            <div style={{ height: FILTER_ROW_HEIGHT }} className="flex">
              <FilterCell colKey={pinnedKey} />
            </div>
            <div ref={pinnedBodyRef} className="min-h-0 flex-1 overflow-hidden">
              <div style={{ height: rows.length * ROW_HEIGHT }}>
                {rows.map((row, i) => (
                  <BodyCell key={i} colKey={pinnedKey} row={row} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div ref={headerRef} className="shrink-0 overflow-x-hidden border-b border-border">
            <div style={{ width: scrollWidth }}>
              <div className="flex" style={{ height: HEADER_ROW_HEIGHT }}>
                {scrollKeys.map((key) => (
                  <HeaderCell key={key} colKey={key} />
                ))}
              </div>
              <div className="flex" style={{ height: FILTER_ROW_HEIGHT }}>
                {scrollKeys.map((key) => (
                  <FilterCell key={key} colKey={key} />
                ))}
              </div>
            </div>
          </div>
          <div className="min-h-0 flex-1">
            {noRows ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {t('table.noRows')}
              </div>
            ) : scrollAreaWidth > 0 && listHeight > 0 ? (
              <FixedSizeList
                outerRef={outerRef}
                height={listHeight}
                width={scrollAreaWidth}
                itemCount={rows.length}
                itemSize={ROW_HEIGHT}
              >
                {ScrollRow}
              </FixedSizeList>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
