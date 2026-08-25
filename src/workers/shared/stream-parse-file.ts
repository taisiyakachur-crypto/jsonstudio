import { JSONParser } from '@streamparser/json'
import type { JsonValue } from '@/types/json'

export interface StreamParseProgress {
  loadedBytes: number
  totalBytes: number
}

export class StreamParseCancelledError extends Error {
  constructor() {
    super('Parsing was cancelled')
    this.name = 'StreamParseCancelledError'
  }
}

export interface StreamParseResult {
  value: JsonValue
  /** The first ~`previewCollectCap` characters of raw text seen, for a read-only preview. */
  previewText: string
}

const YIELD_EVERY_N_CHUNKS = 8
/** Comlink's `onProgress` is a real postMessage round-trip per call -- calling it on every
 *  stream chunk (which can be large -- Chromium's File.stream() often yields chunks in the
 *  hundreds of KB to low MB range, not a fixed small size) adds up needlessly for a UI element
 *  that only needs to visibly update a few times a second. Throttling by time keeps the
 *  progress bar just as live while cutting the RPC count. */
const PROGRESS_THROTTLE_MS = 100

/**
 * Streams a File's bytes into the JSON parser in chunks instead of blocking on one giant
 * `JSON.parse` call, so `onProgress` gets real updates and `isCancelled` gets a chance to
 * interrupt the read between chunks. Shared by every worker that needs to load a big file
 * (see `json-doc.worker.ts` and `table.worker.ts`) so the chunking/yield/cancel dance -- the
 * fiddly part -- only has to be gotten right once.
 */
export async function parseFileStreaming(
  file: File,
  onProgress: (progress: StreamParseProgress) => void,
  isCancelled: () => boolean,
  previewCollectCap = 400_000,
): Promise<StreamParseResult> {
  const total = file.size
  let loaded = 0

  const decoder = new TextDecoder()
  const previewChunks: string[] = []
  let previewChars = 0

  const parser = new JSONParser({ paths: ['$'], keepStack: true })
  let rootValue: JsonValue | undefined
  let parseError: Error | undefined
  parser.onValue = ({ value, stack }) => {
    if (stack.length === 0) rootValue = value as JsonValue
  }
  parser.onError = (err) => {
    parseError = err
  }

  const reader = file.stream().getReader()
  let chunksSinceYield = 0
  let lastProgressAt = 0
  try {
    for (;;) {
      if (isCancelled()) throw new StreamParseCancelledError()

      const { done, value: chunk } = await reader.read()
      if (done) break

      loaded += chunk.byteLength
      if (previewChars < previewCollectCap) {
        const text = decoder.decode(chunk, { stream: true })
        previewChunks.push(text)
        previewChars += text.length
      }
      parser.write(chunk)
      if (parseError) throw parseError

      const now = performance.now()
      if (now - lastProgressAt >= PROGRESS_THROTTLE_MS) {
        lastProgressAt = now
        onProgress({ loadedBytes: loaded, totalBytes: total })
      }

      chunksSinceYield++
      if (chunksSinceYield >= YIELD_EVERY_N_CHUNKS) {
        chunksSinceYield = 0
        // Yield to a *macrotask*, not just a microtask: an incoming `cancel` RPC arrives as a
        // postMessage, only handled between macrotasks -- `await Promise.resolve()` would never
        // let one in.
        await new Promise((resolve) => setTimeout(resolve, 0))
      }
    }
    // With no `separator` configured, the parser already ends itself as soon as it sees the
    // top-level value's closing bracket -- calling `.end()` again after that would hit its
    // "already ended" guard and throw. Only end it here to surface the "half-parsed document"
    // error for a truncated/invalid stream.
    if (!parser.isEnded) parser.end()
  } finally {
    reader.releaseLock()
  }

  if (parseError) throw parseError
  if (rootValue === undefined) throw new Error('Empty or invalid JSON stream')

  onProgress({ loadedBytes: loaded, totalBytes: total })
  return { value: rootValue, previewText: previewChunks.join('') }
}
