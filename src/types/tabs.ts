/** The five tool kinds a tab can host. */
export type ToolType = 'compare' | 'parse' | 'table' | 'chart' | 'format'

export interface CompareTabState {
  panels: Array<{ id: string; title: string; text: string }>
  options: {
    ignoreArrayOrder: boolean
    arrayKeyField: string
    ignoreCase: boolean
    ignoredKeys: string[]
    treatNullEmptyMissingAsEqual: boolean
    numericTolerance: number
    ignoreTypes: boolean
  }
  view: 'side-by-side' | 'unified' | 'tree' | 'table'
  showOnlyDifferences: boolean
}

export interface ParseTabState {
  input: string
  sourceFormat: 'auto' | 'escaped-json' | 'log-json' | 'json5' | 'query-string' | 'key-value' | 'csv' | 'xml' | 'yaml' | 'ndjson' | 'base64' | 'jwt'
  output: string
  csvDelimiter: string
}

export interface TableTabState {
  input: string
  rootPath: string
  flattenDepth: number
  hiddenColumns: string[]
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

export interface FormatTabState {
  input: string
  indent: '2' | '4' | 'tab'
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
