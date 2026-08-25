import * as Comlink from 'comlink'
import { resolveTableRows } from '@/lib/build-table'
import { STREAMING_SIZE_LIMIT_BYTES } from '@/lib/big-file'
import { buildChartData, type Aggregation, type ChartResult } from '@/lib/chart-data'
import { collectColumns, detectColumnType, flattenRows } from '@/lib/flatten'
import { enumeratePaths, type PathEntry } from '@/lib/json-paths'
import type { JsonValue } from '@/types/json'
import type { JsonPathSegment } from '@/types/json-doc'
import { CHART_CANCELLED_ERROR_NAME } from '@/types/chart-worker'
import type { ChartLoadProgress, ChartMeta, ChartWorkerApi } from '@/types/chart-worker'
import { parseFileStreaming } from './shared/stream-parse-file'

class ChartCancelledError extends Error {
  constructor() {
    super('Chart load was cancelled')
    this.name = CHART_CANCELLED_ERROR_NAME
  }
}

interface DocEntry {
  root: JsonValue
  byteSize: number
  rows: JsonValue[]
  rootResolved: boolean
}

const docs = new Map<string, DocEntry>()
const cancelFlags = new Map<string, boolean>()

function buildMeta(id: string, entry: DocEntry): ChartMeta {
  const flat = flattenRows(entry.rows, 0)
  const fields = collectColumns(flat)
  const fieldTypes: Record<string, ReturnType<typeof detectColumnType>> = {}
  for (const field of fields) fieldTypes[field] = detectColumnType(flat.map((row) => row[field]))
  return {
    id,
    byteSize: entry.byteSize,
    totalRows: entry.rows.length,
    fields,
    fieldTypes,
    rootResolved: entry.rootResolved,
  }
}

function store(id: string, root: JsonValue, byteSize: number, rootPath: JsonPathSegment[]): ChartMeta {
  const resolved = resolveTableRows(root, rootPath)
  const entry: DocEntry = { root, byteSize, rows: resolved ?? [], rootResolved: resolved !== null }
  docs.set(id, entry)
  return buildMeta(id, entry)
}

async function loadText(id: string, text: string, rootPath: JsonPathSegment[]): Promise<ChartMeta> {
  let value: JsonValue
  try {
    value = JSON.parse(text) as JsonValue
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Invalid JSON')
  }
  const byteSize = new TextEncoder().encode(text).length
  return store(id, value, byteSize, rootPath)
}

async function loadFileWhole(id: string, file: File, rootPath: JsonPathSegment[]): Promise<ChartMeta> {
  const text = await file.text()
  return loadText(id, text, rootPath)
}

async function loadFileStreaming(
  id: string,
  file: File,
  rootPath: JsonPathSegment[],
  onProgress: (progress: ChartLoadProgress) => void,
): Promise<ChartMeta> {
  cancelFlags.set(id, false)
  try {
    const { value } = await parseFileStreaming(file, onProgress, () => cancelFlags.get(id) === true)
    return store(id, value, file.size, rootPath)
  } catch (err) {
    if (err instanceof Error && err.name === 'StreamParseCancelledError') {
      throw new ChartCancelledError()
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
  onProgress: (progress: ChartLoadProgress) => void,
): Promise<ChartMeta> {
  if (file.size > STREAMING_SIZE_LIMIT_BYTES) {
    return loadFileStreaming(id, file, rootPath, onProgress)
  }
  onProgress({ loadedBytes: 0, totalBytes: file.size })
  const meta = await loadFileWhole(id, file, rootPath)
  onProgress({ loadedBytes: file.size, totalBytes: file.size })
  return meta
}

function setRoot(id: string, rootPath: JsonPathSegment[]): ChartMeta {
  const existing = docs.get(id)
  if (!existing) throw new Error(`Unknown chart document: ${id}`)
  return store(id, existing.root, existing.byteSize, rootPath)
}

function getPaths(id: string): PathEntry[] {
  const existing = docs.get(id)
  if (!existing) return []
  return enumeratePaths(existing.root)
}

function computeChart(
  id: string,
  xField: string,
  yFields: string[],
  aggregation: Aggregation,
  groupBy: string,
): ChartResult {
  const existing = docs.get(id)
  if (!existing) return { data: [], seriesKeys: [] }
  return buildChartData(existing.rows, xField, yFields, aggregation, groupBy)
}

function cancel(id: string): void {
  if (cancelFlags.has(id)) cancelFlags.set(id, true)
}

function close(id: string): void {
  docs.delete(id)
  cancelFlags.delete(id)
}

const api: ChartWorkerApi = {
  loadText,
  loadFile,
  setRoot,
  getPaths,
  computeChart,
  cancel,
  close,
}

Comlink.expose(api)
