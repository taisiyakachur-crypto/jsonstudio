import { DEFAULT_DIFF_OPTIONS } from '@/lib/diff'
import type {
  ChartTabState,
  CompareTabState,
  FormatTabState,
  ParseTabState,
  TableTabState,
  ToolState,
  ToolType,
} from '@/types/tabs'

function makeId(): string {
  return crypto.randomUUID()
}

export function defaultCompareState(): CompareTabState {
  return {
    panels: [
      { id: makeId(), title: 'JSON 1', text: '', softMode: false },
      { id: makeId(), title: 'JSON 2', text: '', softMode: false },
    ],
    options: { ...DEFAULT_DIFF_OPTIONS },
    view: 'tree',
    showOnlyDifferences: false,
  }
}

export function defaultParseState(): ParseTabState {
  return {
    input: '',
    sourceFormat: 'auto',
    csvDelimiter: ',',
    csvCoerceTypes: true,
  }
}

export function defaultTableState(): TableTabState {
  return {
    input: '',
    rootPath: '$',
    flattenDepth: 1,
    hiddenColumns: [],
    columnOrder: [],
    pinFirstColumn: false,
    sortColumn: null,
    sortDir: 'asc',
    search: '',
    columnFilters: {},
    pageSize: 50,
  }
}

export function defaultChartState(): ChartTabState {
  return {
    input: '',
    dataPath: '$',
    chartKind: 'bar',
    xField: '',
    yFields: [],
    aggregation: 'none',
    groupBy: '',
  }
}

export function defaultFormatState(): FormatTabState {
  return {
    input: '',
    indent: '2',
    softMode: false,
    sidebarTab: 'stats',
    jsonPathQuery: '',
    schemaInput: '',
  }
}

export function defaultStateFor<T extends ToolType>(type: T): ToolState[T] {
  const map: { [K in ToolType]: () => ToolState[K] } = {
    compare: defaultCompareState,
    parse: defaultParseState,
    table: defaultTableState,
    chart: defaultChartState,
    format: defaultFormatState,
  }
  return map[type]()
}

export const TOOL_TITLES: Record<ToolType, { uk: string; en: string }> = {
  compare: { uk: 'Порівняння', en: 'Compare' },
  parse: { uk: 'Розбір', en: 'Parse' },
  table: { uk: 'Таблиця', en: 'Table' },
  chart: { uk: 'Діаграма', en: 'Chart' },
  format: { uk: 'Формат і валідація', en: 'Format & Validate' },
}
