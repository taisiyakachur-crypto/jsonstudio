import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChildDescriptor, ChildPage, JsonPathSegment } from '@/types/json-doc'
import { type GetChildrenFn, type LoadMoreRow, pathKey, type TreeNodeRow, type TreeRow } from './types'

const PAGE_SIZE = 100

function toNodeRow(child: ChildDescriptor, depth: number): TreeNodeRow {
  return {
    kind: 'node',
    id: pathKey(child.path),
    path: child.path,
    depth,
    label: child.key,
    type: child.type,
    preview: child.preview,
    hasChildren: child.hasChildren,
    childCount: child.childCount,
    expanded: false,
  }
}

function toLoadMoreRow(parentPath: JsonPathSegment[], depth: number, remaining: number): LoadMoreRow {
  return {
    kind: 'load-more',
    id: `${pathKey(parentPath)}::more`,
    parentPath,
    depth,
    remaining,
    loading: false,
  }
}

function buildPageRows(page: ChildPage, path: JsonPathSegment[], depth: number): TreeRow[] {
  const nodeRows = page.items.map((c) => toNodeRow(c, depth))
  const remaining = page.total - nodeRows.length
  return remaining > 0 ? [...nodeRows, toLoadMoreRow(path, depth, remaining)] : nodeRows
}

export function useJsonTreeRows(docId: string | null, getChildren: GetChildrenFn) {
  const [rows, setRows] = useState<TreeRow[]>([])
  const [rootLoading, setRootLoading] = useState(false)
  const loadedCounts = useRef(new Map<string, number>())

  useEffect(() => {
    let cancelled = false
    setRows([])
    loadedCounts.current = new Map()
    if (!docId) return
    setRootLoading(true)
    void getChildren([], 0, PAGE_SIZE).then((page) => {
      if (cancelled) return
      loadedCounts.current.set(pathKey([]), page.items.length)
      setRows(buildPageRows(page, [], 0))
      setRootLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [docId, getChildren])

  const toggleExpand = useCallback(
    (row: TreeNodeRow) => {
      if (row.expanded) {
        setRows((prev) => {
          const idx = prev.findIndex((r) => r.id === row.id)
          if (idx === -1) return prev
          let end = idx + 1
          while (end < prev.length && prev[end]!.depth > row.depth) end++
          const next = [...prev]
          next.splice(idx + 1, end - (idx + 1))
          next[idx] = { ...row, expanded: false }
          return next
        })
        loadedCounts.current.delete(pathKey(row.path))
        return
      }
      void getChildren(row.path, 0, PAGE_SIZE).then((page) => {
        loadedCounts.current.set(pathKey(row.path), page.items.length)
        setRows((prev) => {
          const idx = prev.findIndex((r) => r.id === row.id)
          if (idx === -1) return prev
          const current = prev[idx]
          if (!current || current.kind !== 'node' || current.expanded) return prev
          const childRows = buildPageRows(page, row.path, row.depth + 1)
          const next = [...prev]
          next[idx] = { ...current, expanded: true }
          next.splice(idx + 1, 0, ...childRows)
          return next
        })
      })
    },
    [getChildren],
  )

  const loadMore = useCallback(
    (row: LoadMoreRow) => {
      const offset = loadedCounts.current.get(pathKey(row.parentPath)) ?? 0
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, loading: true } : r)))
      void getChildren(row.parentPath, offset, PAGE_SIZE).then((page) => {
        const newOffset = offset + page.items.length
        loadedCounts.current.set(pathKey(row.parentPath), newOffset)
        const remaining = page.total - newOffset
        setRows((prev) => {
          const idx = prev.findIndex((r) => r.id === row.id)
          if (idx === -1) return prev
          const newRows = page.items.map((c) => toNodeRow(c, row.depth))
          const next = [...prev]
          if (remaining > 0) {
            next.splice(idx, 1, ...newRows, { ...row, remaining, loading: false })
          } else {
            next.splice(idx, 1, ...newRows)
          }
          return next
        })
      })
    },
    [getChildren],
  )

  return { rows, rootLoading, toggleExpand, loadMore }
}
