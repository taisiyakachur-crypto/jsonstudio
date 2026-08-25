import { EDITOR_SIZE_LIMIT_BYTES, extractPreview } from '@/lib/big-file'
import { previewJsonValue } from '@/lib/json-preview'
import { isJsonArray, isJsonObject, jsonNodeType, type JsonValue } from '@/types/json'
import type { ChildDescriptor, ChildPage, DocMeta, JsonPathSegment } from '@/types/json-doc'

/** Pure helpers shared by the worker (see `json-doc.worker.ts`) and its unit tests. */

export function buildMeta(id: string, value: JsonValue, byteSize: number, rawText: string): DocMeta {
  const { previewText, truncated } = extractPreview(rawText)
  const rootType = jsonNodeType(value)
  const rootChildCount = isJsonArray(value)
    ? value.length
    : isJsonObject(value)
      ? Object.keys(value).length
      : null
  return {
    id,
    byteSize,
    rootType,
    rootChildCount,
    previewText,
    previewTruncated: truncated,
    isLarge: byteSize > EDITOR_SIZE_LIMIT_BYTES,
  }
}

export function resolvePath(root: JsonValue, path: JsonPathSegment[]): JsonValue | undefined {
  let current: JsonValue | undefined = root
  for (const segment of path) {
    if (current == null || typeof current !== 'object') return undefined
    current = isJsonArray(current) ? current[segment as number] : current[segment as string]
  }
  return current
}

export function describeValue(value: JsonValue): Omit<ChildDescriptor, 'key' | 'path'> {
  const type = jsonNodeType(value)
  if (isJsonArray(value)) {
    return { type, hasChildren: value.length > 0, childCount: value.length, preview: previewJsonValue(value) }
  }
  if (isJsonObject(value)) {
    const count = Object.keys(value).length
    return { type, hasChildren: count > 0, childCount: count, preview: previewJsonValue(value) }
  }
  return { type, hasChildren: false, childCount: null, preview: previewJsonValue(value) }
}

export function computeChildren(
  root: JsonValue | undefined,
  path: JsonPathSegment[],
  offset: number,
  limit: number,
): ChildPage {
  if (root === undefined) return { items: [], total: 0 }
  const node = resolvePath(root, path)
  if (node == null || typeof node !== 'object') return { items: [], total: 0 }

  const entries: [JsonPathSegment, JsonValue][] = isJsonArray(node)
    ? node.map((v, i): [JsonPathSegment, JsonValue] => [i, v])
    : Object.entries(node)

  const total = entries.length
  const page = entries.slice(offset, offset + limit)
  const items: ChildDescriptor[] = page.map(([key, value]) => ({
    key: String(key),
    path: [...path, key],
    ...describeValue(value),
  }))
  return { items, total }
}
