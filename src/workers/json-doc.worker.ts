import { JSONParser } from '@streamparser/json'
import * as Comlink from 'comlink'
import { STREAMING_SIZE_LIMIT_BYTES } from '@/lib/big-file'
import type { DocMeta, JsonDocWorkerApi, JsonPathSegment, LoadProgress } from '@/types/json-doc'
import { DOC_CANCELLED_ERROR_NAME } from '@/types/json-doc'
import type { JsonValue } from '@/types/json'
import { buildMeta, computeChildren } from './json-doc-logic'

class DocCancelledError extends Error {
  constructor() {
    super('Document load was cancelled')
    this.name = DOC_CANCELLED_ERROR_NAME
  }
}

const docs = new Map<string, JsonValue>()
const cancelFlags = new Map<string, boolean>()

async function openText(id: string, text: string): Promise<DocMeta> {
  let value: JsonValue
  try {
    value = JSON.parse(text) as JsonValue
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Invalid JSON')
  }
  const byteSize = new TextEncoder().encode(text).length
  docs.set(id, value)
  return buildMeta(id, value, byteSize, text)
}

async function openFileWhole(id: string, file: File): Promise<DocMeta> {
  const text = await file.text()
  return openText(id, text)
}

async function openFileStreaming(
  id: string,
  file: File,
  onProgress: (progress: LoadProgress) => void,
): Promise<DocMeta> {
  const total = file.size
  let loaded = 0

  const decoder = new TextDecoder()
  const previewChunks: string[] = []
  let previewChars = 0
  const PREVIEW_COLLECT_CAP = 400_000

  const parser = new JSONParser({ paths: ['$'], keepStack: true })
  let rootValue: JsonValue | undefined
  let parseError: Error | undefined
  parser.onValue = ({ value, stack }) => {
    if (stack.length === 0) rootValue = value as JsonValue
  }
  parser.onError = (err) => {
    parseError = err
  }

  cancelFlags.set(id, false)
  const reader = file.stream().getReader()
  // How often (in chunks) to yield to a macrotask so a `cancel` RPC -- which
  // arrives as a postMessage, only handled between macrotasks -- can land. A
  // microtask-only yield (`await Promise.resolve()`) never lets one in, but
  // yielding via `setTimeout` on *every* chunk would slow the read down a lot
  // (each chunk is tens of KB), so it's throttled instead of per-chunk.
  const YIELD_EVERY_N_CHUNKS = 8
  let chunksSinceYield = 0
  try {
    for (;;) {
      if (cancelFlags.get(id)) throw new DocCancelledError()

      const { done, value: chunk } = await reader.read()
      if (done) break

      loaded += chunk.byteLength
      if (previewChars < PREVIEW_COLLECT_CAP) {
        const text = decoder.decode(chunk, { stream: true })
        previewChunks.push(text)
        previewChars += text.length
      }
      parser.write(chunk)
      if (parseError) throw parseError
      onProgress({ loadedBytes: loaded, totalBytes: total })

      chunksSinceYield++
      if (chunksSinceYield >= YIELD_EVERY_N_CHUNKS) {
        chunksSinceYield = 0
        await new Promise((resolve) => setTimeout(resolve, 0))
      }
    }
    // With no `separator` configured, the parser already ends itself as soon as it
    // sees the top-level value's closing bracket -- calling `.end()` again after
    // that would hit its "already ended" guard and throw. Only end it here to
    // surface the "half-parsed document" error for a truncated/invalid stream.
    if (!parser.isEnded) parser.end()
  } finally {
    reader.releaseLock()
    cancelFlags.delete(id)
  }

  if (parseError) throw parseError
  if (rootValue === undefined) throw new Error('Empty or invalid JSON stream')

  docs.set(id, rootValue)
  return buildMeta(id, rootValue, total, previewChunks.join(''))
}

async function openFile(
  id: string,
  file: File,
  onProgress: (progress: LoadProgress) => void,
): Promise<DocMeta> {
  if (file.size > STREAMING_SIZE_LIMIT_BYTES) {
    return openFileStreaming(id, file, onProgress)
  }
  onProgress({ loadedBytes: 0, totalBytes: file.size })
  const meta = await openFileWhole(id, file)
  onProgress({ loadedBytes: file.size, totalBytes: file.size })
  return meta
}

function cancel(id: string): void {
  if (cancelFlags.has(id)) cancelFlags.set(id, true)
}

function close(id: string): void {
  docs.delete(id)
  cancelFlags.delete(id)
}

function getChildren(id: string, path: JsonPathSegment[], offset: number, limit: number) {
  return computeChildren(docs.get(id), path, offset, limit)
}

const api: JsonDocWorkerApi = {
  openText,
  openFile,
  cancel,
  close,
  getChildren,
}

Comlink.expose(api)
