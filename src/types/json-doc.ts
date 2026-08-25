import type { JsonNodeType } from './json'

/** A path segment: an object property name, or an array index. */
export type JsonPathSegment = string | number

export interface DocMeta {
  id: string
  byteSize: number
  rootType: JsonNodeType
  /** Number of keys (object) or items (array) at the root; `null` for scalars. */
  rootChildCount: number | null
  /** First ~2000 lines (capped by character count) of the raw source text. */
  previewText: string
  previewTruncated: boolean
  /** `byteSize` exceeds the CodeMirror-editing cutoff (see `lib/big-file.ts`). */
  isLarge: boolean
}

export interface ChildDescriptor {
  /** Property name, or the array index rendered as a string. */
  key: string
  path: JsonPathSegment[]
  type: JsonNodeType
  hasChildren: boolean
  childCount: number | null
  /** Short single-line rendering of the value, for collapsed/leaf display. */
  preview: string
}

export interface ChildPage {
  items: ChildDescriptor[]
  total: number
}

export interface LoadProgress {
  loadedBytes: number
  totalBytes: number
}

/** Thrown (as a plain Error with this `name`) when `cancel()` interrupts a load. */
export const DOC_CANCELLED_ERROR_NAME = 'DocCancelledError'

/**
 * The contract implemented by `workers/json-doc.worker.ts` and consumed through
 * `Comlink.wrap<JsonDocWorkerApi>(...)` on the main thread. Methods are written
 * as their local (non-`Remote`) shape; Comlink's `Remote<T>` promisifies them.
 */
export interface JsonDocWorkerApi {
  openText(id: string, text: string): Promise<DocMeta>
  openFile(
    id: string,
    file: File,
    onProgress: (progress: LoadProgress) => void,
  ): Promise<DocMeta>
  cancel(id: string): void
  close(id: string): void
  getChildren(
    id: string,
    path: JsonPathSegment[],
    offset: number,
    limit: number,
  ): ChildPage
}
