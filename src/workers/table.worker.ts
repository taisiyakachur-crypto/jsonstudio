import * as Comlink from 'comlink'
import { buildTable, type BuildTableResult } from '@/lib/build-table'
import { STREAMING_SIZE_LIMIT_BYTES } from '@/lib/big-file'
import { enumeratePaths, type PathEntry } from '@/lib/json-paths'
import { queryTable, type TableQuery, type TableQueryResult } from '@/lib/table-query'
import type { JsonValue } from '@/types/json'
import type { JsonPathSegment } from '@/types/json-doc'
import { TABLE_CANCELLED_ERROR_NAME } from '@/types/table-worker'
import type { TableLoadProgress, TableMeta, TableWorkerApi } from '@/types/table-worker'
import { parseFileStreaming } from './shared/stream-parse-file'

class TableCancelledError extends Error {
  constructor() {
    super('Table load was cancelled')
    this.name = TABLE_CANCELLED_ERROR_NAME
  }
}

interface DocEntry {
  root: JsonValue
  byteSize: number
  built: BuildTableResult
}

const docs = new Map<string, DocEntry>()
const cancelFlags = new Map<string, boolean>()

function buildMeta(id: string, entry: DocEntry): TableMeta {
  return {
    id,
    byteSize: entry.byteSize,
    totalRows: entry.built.rows.length,
    columns: entry.built.columns,
    rootResolved: entry.built.rootResolved,
  }
}

function store(id: string, root: JsonValue, byteSize: number, rootPath: JsonPathSegment[], flattenDepth: number): TableMeta {
  const built = buildTable(root, rootPath, flattenDepth)
  const entry: DocEntry = { root, byteSize, built }
  docs.set(id, entry)
  return buildMeta(id, entry)
}

async function loadText(
  id: string,
  text: string,
  rootPath: JsonPathSegment[],
  flattenDepth: number,
): Promise<TableMeta> {
  let value: JsonValue
  try {
    value = JSON.parse(text) as JsonValue
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Invalid JSON')
  }
  const byteSize = new TextEncoder().encode(text).length
  return store(id, value, byteSize, rootPath, flattenDepth)
}

async function loadFileWhole(
  id: string,
  file: File,
  rootPath: JsonPathSegment[],
  flattenDepth: number,
): Promise<TableMeta> {
  const text = await file.text()
  return loadText(id, text, rootPath, flattenDepth)
}

async function loadFileStreaming(
  id: string,
  file: File,
  rootPath: JsonPathSegment[],
  flattenDepth: number,
  onProgress: (progress: TableLoadProgress) => void,
): Promise<TableMeta> {
  cancelFlags.set(id, false)
  try {
    const { value } = await parseFileStreaming(file, onProgress, () => cancelFlags.get(id) === true)
    return store(id, value, file.size, rootPath, flattenDepth)
  } catch (err) {
    if (err instanceof Error && err.name === 'StreamParseCancelledError') {
      throw new TableCancelledError()
    }
    throw err
  } finally {
    cancelFlags.delete(id)
  }
}

async function loadFile(
  id: string,
  file: File,
  rootPath: JsonPathSegment[],
  flattenDepth: number,
  onProgress: (progress: TableLoadProgress) => void,
): Promise<TableMeta> {
  if (file.size > STREAMING_SIZE_LIMIT_BYTES) {
    return loadFileStreaming(id, file, rootPath, flattenDepth, onProgress)
  }
  onProgress({ loadedBytes: 0, totalBytes: file.size })
  const meta = await loadFileWhole(id, file, rootPath, flattenDepth)
  onProgress({ loadedBytes: file.size, totalBytes: file.size })
  return meta
}

function setRootAndDepth(id: string, rootPath: JsonPathSegment[], flattenDepth: number): TableMeta {
  const existing = docs.get(id)
  if (!existing) throw new Error(`Unknown table document: ${id}`)
  return store(id, existing.root, existing.byteSize, rootPath, flattenDepth)
}

function getPaths(id: string): PathEntry[] {
  const existing = docs.get(id)
  if (!existing) return []
  return enumeratePaths(existing.root)
}

function queryRows(id: string, query: TableQuery): TableQueryResult {
  const existing = docs.get(id)
  if (!existing) return { rows: [], totalFiltered: 0 }
  return queryTable(existing.built.rows, query)
}

function cancel(id: string): void {
  if (cancelFlags.has(id)) cancelFlags.set(id, true)
}

function close(id: string): void {
  docs.delete(id)
  cancelFlags.delete(id)
}

const api: TableWorkerApi = {
  loadText,
  loadFile,
  setRootAndDepth,
  getPaths,
  queryRows,
  cancel,
  close,
}

Comlink.expose(api)
