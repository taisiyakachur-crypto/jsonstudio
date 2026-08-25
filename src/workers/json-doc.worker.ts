import * as Comlink from 'comlink'
import { STREAMING_SIZE_LIMIT_BYTES } from '@/lib/big-file'
import type { DocMeta, JsonDocWorkerApi, JsonPathSegment, LoadProgress } from '@/types/json-doc'
import { DOC_CANCELLED_ERROR_NAME } from '@/types/json-doc'
import type { JsonValue } from '@/types/json'
import { buildMeta, computeChildren } from './json-doc-logic'
import { parseFileStreaming } from './shared/stream-parse-file'

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
  cancelFlags.set(id, false)
  try {
    const { value, previewText } = await parseFileStreaming(
      file,
      onProgress,
      () => cancelFlags.get(id) === true,
    )
    docs.set(id, value)
    return buildMeta(id, value, file.size, previewText)
  } catch (err) {
    if (err instanceof Error && err.name === 'StreamParseCancelledError') {
      throw new DocCancelledError()
    }
    throw err
  } finally {
    cancelFlags.delete(id)
  }
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
