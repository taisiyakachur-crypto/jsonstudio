import type { ColumnType } from '@/lib/flatten'
import type { Aggregation, ChartResult } from '@/lib/chart-data'
import type { PathEntry } from '@/lib/json-paths'
import type { JsonPathSegment } from '@/types/json-doc'

export interface ChartLoadProgress {
  loadedBytes: number
  totalBytes: number
}

export const CHART_CANCELLED_ERROR_NAME = 'ChartCancelledError'

export interface ChartMeta {
  id: string
  byteSize: number
  totalRows: number
  /** Top-level field names across the resolved rows (nested objects are not flattened here --
   *  Chart plots by field, it doesn't need Table's full column model). */
  fields: string[]
  fieldTypes: Record<string, ColumnType>
  /** False when the root path didn't resolve to an array or object. */
  rootResolved: boolean
}

export interface ChartWorkerApi {
  loadText(id: string, text: string, rootPath: JsonPathSegment[]): Promise<ChartMeta>
  loadFile(
    id: string,
    file: File,
    rootPath: JsonPathSegment[],
    onProgress: (progress: ChartLoadProgress) => void,
  ): Promise<ChartMeta>
  /** Re-resolves the root path against the already-parsed document -- no re-parsing needed. */
  setRoot(id: string, rootPath: JsonPathSegment[]): ChartMeta
  getPaths(id: string): PathEntry[]
  computeChart(id: string, xField: string, yFields: string[], aggregation: Aggregation, groupBy: string): ChartResult
  cancel(id: string): void
  close(id: string): void
}
