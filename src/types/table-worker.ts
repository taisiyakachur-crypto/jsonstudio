import type { ColumnMeta, TableQuery, TableQueryResult } from '@/lib/table-query'
import type { PathEntry } from '@/lib/json-paths'
import type { JsonPathSegment } from '@/types/json-doc'

export interface TableLoadProgress {
  loadedBytes: number
  totalBytes: number
}

export const TABLE_CANCELLED_ERROR_NAME = 'TableCancelledError'

export interface TableMeta {
  id: string
  byteSize: number
  /** Row count before any filtering. */
  totalRows: number
  columns: ColumnMeta[]
  /** False when the root path didn't resolve to an array or object. */
  rootResolved: boolean
}

export interface TableWorkerApi {
  loadText(id: string, text: string, rootPath: JsonPathSegment[], flattenDepth: number): Promise<TableMeta>
  loadFile(
    id: string,
    file: File,
    rootPath: JsonPathSegment[],
    flattenDepth: number,
    onProgress: (progress: TableLoadProgress) => void,
  ): Promise<TableMeta>
  /** Re-flattens from the already-parsed document -- no re-parsing needed. */
  setRootAndDepth(id: string, rootPath: JsonPathSegment[], flattenDepth: number): TableMeta
  getPaths(id: string): PathEntry[]
  queryRows(id: string, query: TableQuery): TableQueryResult
  cancel(id: string): void
  close(id: string): void
}
