import type { DiffOptions } from '@/lib/diff'
import type { SourceFormat } from '@/lib/parsers/types'

/** The five tool kinds a tab can host. */
export type ToolType = 'compare' | 'parse' | 'table' | 'chart' | 'format'

export interface ComparePanelState {
  id: string
  title: string
  text: string
  softMode: boolean
}

export interface CompareTabState {
  panels: ComparePanelState[]
  options: DiffOptions
  view: 'side-by-side' | 'unified' | 'tree' | 'table'
  showOnlyDifferences: boolean
}

export interface ParseTabState {
  input: string
  sourceFormat: SourceFormat
  csvDelimiter: string
  csvCoerceTypes: boolean
}

export interface TableTabState {
  input: string
  rootPath: string
  flattenDepth: number
  hiddenColumns: string[]
  columnOrder: string[]
  pinFirstColumn: boolean
  sortColumn: string | null
  sortDir: 'asc' | 'desc'
  search: string
  columnFilters: Record<string, string>
  pageSize: number
}

export interface ChartTabState {
  input: string
  dataPath: string
  chartKind: 'bar' | 'bar-stacked' | 'line' | 'pie' | 'area' | 'scatter'
  xField: string
  yFields: string[]
  aggregation: 'none' | 'sum' | 'count' | 'avg' | 'min' | 'max'
  groupBy: string
}

export type FormatSidebarTab = 'stats' | 'jsonpath' | 'schema' | 'typescript'

export interface FormatTabState {
  input: string
  indent: '2' | '4' | 'tab'
  softMode: boolean
  sidebarTab: FormatSidebarTab
  jsonPathQuery: string
  schemaInput: string
}

export type ToolState = {
  compare: CompareTabState
  parse: ParseTabState
  table: TableTabState
  chart: ChartTabState
  format: FormatTabState
}

export interface Tab<T extends ToolType = ToolType> {
  id: string
  type: T
  title: string
  state: ToolState[T]
  createdAt: number
  updatedAt: number
  /** True when content was too large to auto-persist (see 5MB rule). */
  contentTruncatedFromPersist?: boolean
}

/** Proper discriminated union: narrowing on `type` narrows `state` too. */
export type AnyTab = { [K in ToolType]: Tab<K> }[ToolType]
