import { previewJsonValue } from './json-preview'
import { isJsonObject, type JsonValue } from '@/types/json'

export type ChartKind = 'bar' | 'bar-stacked' | 'line' | 'pie' | 'area' | 'scatter'
export type Aggregation = 'none' | 'sum' | 'count' | 'avg' | 'min' | 'max'

export interface ChartPoint {
  x: string
  [seriesKey: string]: string | number
}

export interface ChartResult {
  data: ChartPoint[]
  /** Data keys (other than `x`) to render as series, in display order. */
  seriesKeys: string[]
}

function toNumber(value: JsonValue | undefined): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function cellLabel(value: JsonValue | undefined): string {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return previewJsonValue(value)
}

function aggregateValues(values: number[], mode: Aggregation): number {
  if (mode === 'count') return values.length
  if (values.length === 0) return 0
  switch (mode) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0)
    case 'avg':
      return values.reduce((a, b) => a + b, 0) / values.length
    case 'min':
      return Math.min(...values)
    case 'max':
      return Math.max(...values)
    case 'none':
      return values[values.length - 1]
  }
}

const xCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

/**
 * Buckets and aggregates rows into chart-ready points. Two distinct shapes, chosen for
 * simplicity over generality:
 *  - with `groupBy`: only `yFields[0]` is used as the measure, and the distinct `groupBy`
 *    values become the series (a "pivot" -- one column per group, per x value). Combining
 *    multiple y-fields with a group-by would mean naming series as "field x group" pairs,
 *    which isn't worth the complexity here.
 *  - without `groupBy`: each entry in `yFields` is its own series, aggregated independently
 *    per x value.
 * `aggregation: 'none'` skips bucketing entirely and emits one point per row, for scatter/line
 * plots over raw (non-aggregated) data.
 */
export function buildChartData(
  rows: JsonValue[],
  xField: string,
  yFields: string[],
  aggregation: Aggregation,
  groupBy: string,
): ChartResult {
  const objRows = rows.filter(isJsonObject)

  if (aggregation === 'none') {
    const seriesKeys = yFields
    const data: ChartPoint[] = objRows.map((row) => {
      const point: ChartPoint = { x: cellLabel(row[xField]) }
      for (const y of seriesKeys) {
        const n = toNumber(row[y])
        if (n !== null) point[y] = n
      }
      return point
    })
    return { data, seriesKeys }
  }

  if (groupBy) {
    const yField = yFields[0]
    const buckets = new Map<string, Map<string, number[]>>()
    const groupValues = new Set<string>()
    for (const row of objRows) {
      const x = cellLabel(row[xField])
      const g = cellLabel(row[groupBy])
      groupValues.add(g)
      const inner = buckets.get(x) ?? new Map<string, number[]>()
      buckets.set(x, inner)
      const values = inner.get(g) ?? []
      inner.set(g, values)
      if (aggregation === 'count') values.push(1)
      else {
        const n = toNumber(yField ? row[yField] : undefined)
        if (n !== null) values.push(n)
      }
    }
    const seriesKeys = [...groupValues]
    const data: ChartPoint[] = [...buckets.entries()]
      .map(([x, inner]) => {
        const point: ChartPoint = { x }
        for (const g of seriesKeys) point[g] = aggregateValues(inner.get(g) ?? [], aggregation)
        return point
      })
      .sort((a, b) => xCollator.compare(a.x, b.x))
    return { data, seriesKeys }
  }

  const buckets = new Map<string, Map<string, number[]>>()
  for (const row of objRows) {
    const x = cellLabel(row[xField])
    const inner = buckets.get(x) ?? new Map<string, number[]>()
    buckets.set(x, inner)
    for (const y of yFields) {
      const values = inner.get(y) ?? []
      inner.set(y, values)
      if (aggregation === 'count') values.push(1)
      else {
        const n = toNumber(row[y])
        if (n !== null) values.push(n)
      }
    }
  }
  const data: ChartPoint[] = [...buckets.entries()]
    .map(([x, inner]) => {
      const point: ChartPoint = { x }
      for (const y of yFields) point[y] = aggregateValues(inner.get(y) ?? [], aggregation)
      return point
    })
    .sort((a, b) => xCollator.compare(a.x, b.x))
  return { data, seriesKeys: yFields }
}
