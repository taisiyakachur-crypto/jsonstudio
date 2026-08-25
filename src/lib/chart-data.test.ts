import { describe, expect, it } from 'vitest'
import { buildChartData } from './chart-data'
import type { JsonValue } from '@/types/json'

const rows: JsonValue[] = [
  { region: 'EU', category: 'A', amount: 10 },
  { region: 'EU', category: 'B', amount: 5 },
  { region: 'US', category: 'A', amount: 7 },
  { region: 'US', category: 'A', amount: 3 },
]

describe('buildChartData', () => {
  it('aggregates one series per x value with sum', () => {
    const result = buildChartData(rows, 'region', ['amount'], 'sum', '')
    expect(result.seriesKeys).toEqual(['amount'])
    expect(result.data).toEqual([
      { x: 'EU', amount: 15 },
      { x: 'US', amount: 10 },
    ])
  })

  it('aggregates multiple y-fields as independent series when there is no groupBy', () => {
    const withSecond: JsonValue[] = rows.map((r) => ({ ...(r as object), bonus: 1 }))
    const result = buildChartData(withSecond, 'region', ['amount', 'bonus'], 'sum', '')
    expect(result.seriesKeys).toEqual(['amount', 'bonus'])
    expect(result.data).toEqual([
      { x: 'EU', amount: 15, bonus: 2 },
      { x: 'US', amount: 10, bonus: 2 },
    ])
  })

  it('pivots into one series per groupBy value, using only the first y-field', () => {
    const result = buildChartData(rows, 'region', ['amount'], 'sum', 'category')
    expect(result.seriesKeys.sort()).toEqual(['A', 'B'])
    const eu = result.data.find((d) => d.x === 'EU')
    const us = result.data.find((d) => d.x === 'US')
    expect(eu).toEqual({ x: 'EU', A: 10, B: 5 })
    expect(us).toEqual({ x: 'US', A: 10, B: 0 })
  })

  it('counts rows per bucket regardless of y-field values', () => {
    const result = buildChartData(rows, 'region', ['amount'], 'count', '')
    expect(result.data).toEqual([
      { x: 'EU', amount: 2 },
      { x: 'US', amount: 2 },
    ])
  })

  it('computes avg/min/max correctly', () => {
    expect(buildChartData(rows, 'region', ['amount'], 'avg', '').data).toEqual([
      { x: 'EU', amount: 7.5 },
      { x: 'US', amount: 5 },
    ])
    expect(buildChartData(rows, 'region', ['amount'], 'min', '').data).toEqual([
      { x: 'EU', amount: 5 },
      { x: 'US', amount: 3 },
    ])
    expect(buildChartData(rows, 'region', ['amount'], 'max', '').data).toEqual([
      { x: 'EU', amount: 10 },
      { x: 'US', amount: 7 },
    ])
  })

  it('emits one point per row without bucketing when aggregation is none', () => {
    const result = buildChartData(rows, 'category', ['amount'], 'none', '')
    expect(result.data).toEqual([
      { x: 'A', amount: 10 },
      { x: 'B', amount: 5 },
      { x: 'A', amount: 7 },
      { x: 'A', amount: 3 },
    ])
  })

  it('skips non-numeric y values', () => {
    const dirty: JsonValue[] = [{ x: 'A', y: 'not a number' }, { x: 'A', y: 5 }]
    const result = buildChartData(dirty, 'x', ['y'], 'sum', '')
    expect(result.data).toEqual([{ x: 'A', y: 5 }])
  })

  it('ignores non-object rows', () => {
    const mixed: JsonValue[] = [{ x: 'A', y: 1 }, 'not an object', 42]
    const result = buildChartData(mixed, 'x', ['y'], 'sum', '')
    expect(result.data).toEqual([{ x: 'A', y: 1 }])
  })

  it('sorts aggregated x values naturally', () => {
    const numericX: JsonValue[] = [
      { x: '10', y: 1 },
      { x: '2', y: 1 },
      { x: '1', y: 1 },
    ]
    const result = buildChartData(numericX, 'x', ['y'], 'sum', '')
    expect(result.data.map((d) => d.x)).toEqual(['1', '2', '10'])
  })
})
