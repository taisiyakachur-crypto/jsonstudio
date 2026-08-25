import type { ChildPage, JsonPathSegment } from '@/types/json-doc'
import type { JsonNodeType } from '@/types/json'

export interface TreeNodeRow {
  kind: 'node'
  id: string
  path: JsonPathSegment[]
  depth: number
  label: string
  type: JsonNodeType
  preview: string
  hasChildren: boolean
  childCount: number | null
  expanded: boolean
}

export interface LoadMoreRow {
  kind: 'load-more'
  id: string
  parentPath: JsonPathSegment[]
  depth: number
  remaining: number
  loading: boolean
}

export type TreeRow = TreeNodeRow | LoadMoreRow

export type GetChildrenFn = (
  path: JsonPathSegment[],
  offset: number,
  limit: number,
) => Promise<ChildPage>

export function pathKey(path: JsonPathSegment[]): string {
  return JSON.stringify(path)
}
