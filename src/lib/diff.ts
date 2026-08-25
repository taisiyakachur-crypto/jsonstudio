import { formatJsonPath } from './json-path'
import { previewJsonValue } from './json-preview'
import { isJsonArray, isJsonObject, jsonNodeType, type JsonNodeType, type JsonValue } from '@/types/json'
import type { JsonPathSegment } from '@/types/json-doc'

export type DiffStatus = 'added' | 'removed' | 'changed' | 'same'
export type DiffValueType = JsonNodeType | 'missing'

export interface DiffOptions {
  /** Compare array items regardless of position (best-effort matching without a key). */
  ignoreArrayOrder: boolean
  /** When set, match objects inside arrays by this property instead of by index/position. */
  arrayKeyField: string
  ignoreCase: boolean
  /**
   * Object keys to skip entirely, as dot-separated patterns matched against the tail of a
   * key's path (`*` matches exactly one segment): `*.updatedAt`, `meta.*`.
   */
  ignoredKeys: string[]
  /** Treat a missing key, `null` and `""` as equivalent to each other. */
  treatNullEmptyMissingAsEqual: boolean
  /** Two numbers within this absolute distance are considered equal. */
  numericTolerance: number
  /** Compare primitives by their string form, so `"1"` equals `1`. */
  ignoreTypes: boolean
}

export const DEFAULT_DIFF_OPTIONS: DiffOptions = {
  ignoreArrayOrder: false,
  arrayKeyField: '',
  ignoreCase: false,
  ignoredKeys: [],
  treatNullEmptyMissingAsEqual: false,
  numericTolerance: 0,
  ignoreTypes: false,
}

export interface DiffCounts {
  added: number
  removed: number
  changed: number
  same: number
}

export interface DiffNode {
  path: JsonPathSegment[]
  key: string
  status: DiffStatus
  leftType: DiffValueType
  rightType: DiffValueType
  leftPreview: string | null
  rightPreview: string | null
  /** `null` for leaves (scalars, or one side missing a scalar); an array (possibly empty) for containers. */
  children: DiffNode[] | null
  counts: DiffCounts
}

export interface DiffTableRow {
  path: JsonPathSegment[]
  pathLabel: string
  status: DiffStatus
  /** For a `changed` row: whether the two sides differ in value or in JSON type. `null` otherwise. */
  changeKind: 'value' | 'type' | null
  leftPreview: string | null
  rightPreview: string | null
}

/** Sentinel for "this key/index does not exist on this side" -- never a valid `JsonValue`. */
const MISSING = Symbol('missing')
type Maybe = JsonValue | typeof MISSING

function isEmptyish(v: Maybe): boolean {
  return v === MISSING || v === null || v === ''
}

function emptyCounts(): DiffCounts {
  return { added: 0, removed: 0, changed: 0, same: 0 }
}

function addCounts(into: DiffCounts, from: DiffCounts): void {
  into.added += from.added
  into.removed += from.removed
  into.changed += from.changed
  into.same += from.same
}

function deriveContainerStatus(counts: DiffCounts): DiffStatus {
  return counts.added === 0 && counts.removed === 0 && counts.changed === 0 ? 'same' : 'changed'
}

function typeOf(v: Maybe): DiffValueType {
  return v === MISSING ? 'missing' : jsonNodeType(v)
}

function previewOf(v: Maybe): string | null {
  return v === MISSING ? null : previewJsonValue(v)
}

function leaf(path: JsonPathSegment[], status: DiffStatus, left: Maybe, right: Maybe): DiffNode {
  const counts = emptyCounts()
  counts[status] += 1
  return {
    path,
    key: String(path[path.length - 1] ?? ''),
    status,
    leftType: typeOf(left),
    rightType: typeOf(right),
    leftPreview: previewOf(left),
    rightPreview: previewOf(right),
    children: null,
    counts,
  }
}

/** Builds a node for a value that exists only on one side, recursing so every descendant is
 *  individually marked `added`/`removed` too (rather than collapsing the whole subtree into
 *  one leaf). */
function wholeSubtree(path: JsonPathSegment[], value: JsonValue, status: 'added' | 'removed'): DiffNode {
  const left = status === 'removed' ? value : MISSING
  const right = status === 'added' ? value : MISSING

  if (isJsonObject(value)) {
    const children = Object.keys(value)
      .sort((a, b) => a.localeCompare(b))
      .map((k) => wholeSubtree([...path, k], value[k] as JsonValue, status))
    const counts = emptyCounts()
    children.forEach((c) => addCounts(counts, c.counts))
    return {
      path,
      key: String(path[path.length - 1] ?? ''),
      status,
      leftType: typeOf(left),
      rightType: typeOf(right),
      leftPreview: previewOf(left),
      rightPreview: previewOf(right),
      children,
      counts,
    }
  }
  if (isJsonArray(value)) {
    const children = value.map((v, i) => wholeSubtree([...path, i], v, status))
    const counts = emptyCounts()
    children.forEach((c) => addCounts(counts, c.counts))
    return {
      path,
      key: String(path[path.length - 1] ?? ''),
      status,
      leftType: typeOf(left),
      rightType: typeOf(right),
      leftPreview: previewOf(left),
      rightPreview: previewOf(right),
      children,
      counts,
    }
  }
  return leaf(path, status, left, right)
}

function toFiniteNumber(v: JsonValue): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function scalarsEqual(a: JsonValue, b: JsonValue, opts: DiffOptions): boolean {
  if (opts.treatNullEmptyMissingAsEqual && isEmptyish(a) && isEmptyish(b)) return true

  if (opts.ignoreTypes) {
    const na = toFiniteNumber(a)
    const nb = toFiniteNumber(b)
    if (na !== null && nb !== null) return Math.abs(na - nb) <= opts.numericTolerance
    const sa = String(a)
    const sb = String(b)
    return opts.ignoreCase ? sa.toLowerCase() === sb.toLowerCase() : sa === sb
  }

  if (typeof a === 'number' && typeof b === 'number') {
    return Math.abs(a - b) <= opts.numericTolerance
  }
  if (typeof a === 'string' && typeof b === 'string') {
    return opts.ignoreCase ? a.toLowerCase() === b.toLowerCase() : a === b
  }
  return a === b
}

const IGNORE_WILDCARD = '*'

/** `path` is an object-key path (array indices are dropped); `pattern` is dot-separated with `*`
 *  matching exactly one segment, anchored to the end of `path` (`meta.*` matches `a.meta.x` too). */
function matchesIgnorePattern(keyPath: string[], pattern: string): boolean {
  const parts = pattern.split('.').filter((p) => p.length > 0)
  if (parts.length === 0 || parts.length > keyPath.length) return false
  const tail = keyPath.slice(keyPath.length - parts.length)
  return parts.every((p, i) => p === IGNORE_WILDCARD || p === tail[i])
}

export function isIgnoredKeyPath(path: JsonPathSegment[], patterns: string[]): boolean {
  if (patterns.length === 0) return false
  const keyPath = path.filter((s): s is string => typeof s === 'string')
  return patterns.some((pattern) => matchesIgnorePattern(keyPath, pattern))
}

function diffObject(left: Record<string, JsonValue>, right: Record<string, JsonValue>, path: JsonPathSegment[], opts: DiffOptions): DiffNode {
  const allKeys = Array.from(new Set([...Object.keys(left), ...Object.keys(right)])).sort((a, b) =>
    a.localeCompare(b),
  )
  const children: DiffNode[] = []
  const counts = emptyCounts()
  for (const key of allKeys) {
    const childPath = [...path, key]
    if (isIgnoredKeyPath(childPath, opts.ignoredKeys)) continue
    const hasLeft = Object.prototype.hasOwnProperty.call(left, key)
    const hasRight = Object.prototype.hasOwnProperty.call(right, key)
    const lv: Maybe = hasLeft ? left[key]! : MISSING
    const rv: Maybe = hasRight ? right[key]! : MISSING
    const child = diffAt(lv, rv, childPath, opts)
    children.push(child)
    addCounts(counts, child.counts)
  }
  return {
    path,
    key: String(path[path.length - 1] ?? ''),
    status: deriveContainerStatus(counts),
    leftType: 'object',
    rightType: 'object',
    leftPreview: previewJsonValue(left),
    rightPreview: previewJsonValue(right),
    children,
    counts,
  }
}

function containerNode(
  path: JsonPathSegment[],
  type: 'array',
  left: JsonValue,
  right: JsonValue,
  children: DiffNode[],
): DiffNode {
  const counts = emptyCounts()
  children.forEach((c) => addCounts(counts, c.counts))
  return {
    path,
    key: String(path[path.length - 1] ?? ''),
    status: deriveContainerStatus(counts),
    leftType: type,
    rightType: type,
    leftPreview: previewJsonValue(left),
    rightPreview: previewJsonValue(right),
    children,
    counts,
  }
}

function diffArrayByIndex(left: JsonValue[], right: JsonValue[], path: JsonPathSegment[], opts: DiffOptions): DiffNode {
  const length = Math.max(left.length, right.length)
  const children: DiffNode[] = []
  for (let i = 0; i < length; i++) {
    const lv: Maybe = i < left.length ? left[i]! : MISSING
    const rv: Maybe = i < right.length ? right[i]! : MISSING
    children.push(diffAt(lv, rv, [...path, i], opts))
  }
  return containerNode(path, 'array', left, right, children)
}

/** Matches array elements by `opts.arrayKeyField` via a `Map` lookup (O(n)), not nested loops. */
function diffArrayByKey(left: JsonValue[], right: JsonValue[], path: JsonPathSegment[], opts: DiffOptions): DiffNode {
  const keyField = opts.arrayKeyField

  function keyOf(v: JsonValue): string | undefined {
    return isJsonObject(v) && keyField in v ? JSON.stringify(v[keyField]) : undefined
  }

  const leftByKey = new Map<string, { index: number; value: JsonValue }>()
  const leftUnkeyed: number[] = []
  left.forEach((v, i) => {
    const k = keyOf(v)
    if (k === undefined) leftUnkeyed.push(i)
    else leftByKey.set(k, { index: i, value: v })
  })

  const rightByKey = new Map<string, { index: number; value: JsonValue }>()
  const rightUnkeyed: number[] = []
  right.forEach((v, i) => {
    const k = keyOf(v)
    if (k === undefined) rightUnkeyed.push(i)
    else rightByKey.set(k, { index: i, value: v })
  })

  const children: DiffNode[] = []
  for (const [key, l] of leftByKey) {
    const r = rightByKey.get(key)
    children.push(diffAt(l.value, r ? r.value : MISSING, [...path, l.index], opts))
  }
  for (const [key, r] of rightByKey) {
    if (leftByKey.has(key)) continue
    children.push(diffAt(MISSING, r.value, [...path, r.index], opts))
  }

  const unkeyedPairs = Math.min(leftUnkeyed.length, rightUnkeyed.length)
  for (let i = 0; i < unkeyedPairs; i++) {
    children.push(diffAt(left[leftUnkeyed[i]!]!, right[rightUnkeyed[i]!]!, [...path, leftUnkeyed[i]!], opts))
  }
  for (let i = unkeyedPairs; i < leftUnkeyed.length; i++) {
    children.push(diffAt(left[leftUnkeyed[i]!]!, MISSING, [...path, leftUnkeyed[i]!], opts))
  }
  for (let i = unkeyedPairs; i < rightUnkeyed.length; i++) {
    children.push(diffAt(MISSING, right[rightUnkeyed[i]!]!, [...path, rightUnkeyed[i]!], opts))
  }

  return containerNode(path, 'array', left, right, children)
}

/** Best-effort matching without a key field: pairs up deeply-equal elements first (order-
 *  independent), then pairs whatever's left positionally so near-misses show as `changed`
 *  instead of an unrelated `removed` + `added` pair. */
function diffArrayUnordered(left: JsonValue[], right: JsonValue[], path: JsonPathSegment[], opts: DiffOptions): DiffNode {
  const usedRight = new Set<number>()
  const leftUnmatched: number[] = []
  const matchedPairs: Array<[number, number]> = []

  for (let li = 0; li < left.length; li++) {
    let matchRi = -1
    for (let ri = 0; ri < right.length; ri++) {
      if (usedRight.has(ri)) continue
      if (isDeepEqual(left[li]!, right[ri]!, opts)) {
        matchRi = ri
        break
      }
    }
    if (matchRi === -1) leftUnmatched.push(li)
    else {
      usedRight.add(matchRi)
      matchedPairs.push([li, matchRi])
    }
  }
  const rightUnmatched = right.map((_, ri) => ri).filter((ri) => !usedRight.has(ri))

  const children: DiffNode[] = []
  for (const [li, ri] of matchedPairs) {
    children.push(diffAt(left[li]!, right[ri]!, [...path, li], opts))
  }
  const pairCount = Math.min(leftUnmatched.length, rightUnmatched.length)
  for (let i = 0; i < pairCount; i++) {
    children.push(diffAt(left[leftUnmatched[i]!]!, right[rightUnmatched[i]!]!, [...path, leftUnmatched[i]!], opts))
  }
  for (let i = pairCount; i < leftUnmatched.length; i++) {
    children.push(diffAt(left[leftUnmatched[i]!]!, MISSING, [...path, leftUnmatched[i]!], opts))
  }
  for (let i = pairCount; i < rightUnmatched.length; i++) {
    children.push(diffAt(MISSING, right[rightUnmatched[i]!]!, [...path, rightUnmatched[i]!], opts))
  }

  return containerNode(path, 'array', left, right, children)
}

function isDeepEqual(a: JsonValue, b: JsonValue, opts: DiffOptions): boolean {
  return diffAt(a, b, [], opts).status === 'same'
}

function diffArray(left: JsonValue[], right: JsonValue[], path: JsonPathSegment[], opts: DiffOptions): DiffNode {
  if (opts.arrayKeyField.trim() !== '') return diffArrayByKey(left, right, path, opts)
  if (opts.ignoreArrayOrder) return diffArrayUnordered(left, right, path, opts)
  return diffArrayByIndex(left, right, path, opts)
}

function diffAt(left: Maybe, right: Maybe, path: JsonPathSegment[], opts: DiffOptions): DiffNode {
  if (opts.treatNullEmptyMissingAsEqual && isEmptyish(left) && isEmptyish(right)) {
    return leaf(path, 'same', left, right)
  }

  if (left === MISSING || right === MISSING) {
    const status: 'added' | 'removed' = left === MISSING ? 'added' : 'removed'
    const present = (left === MISSING ? right : left) as JsonValue
    return wholeSubtree(path, present, status)
  }

  if (isJsonObject(left) && isJsonObject(right)) return diffObject(left, right, path, opts)
  if (isJsonArray(left) && isJsonArray(right)) return diffArray(left, right, path, opts)

  const leftIsContainer = isJsonObject(left) || isJsonArray(left)
  const rightIsContainer = isJsonObject(right) || isJsonArray(right)
  if (leftIsContainer || rightIsContainer) {
    // Type mismatch (e.g. an object replaced by a string): a single changed leaf, not a subtree.
    return leaf(path, 'changed', left, right)
  }

  return leaf(path, scalarsEqual(left, right, opts) ? 'same' : 'changed', left, right)
}

/** Deep-diffs two JSON documents. Pure and synchronous; see `workers/diff.worker.ts` for the
 *  progress/cancellation wrapper used when this runs on documents large enough to matter. */
export function diffValues(left: JsonValue, right: JsonValue, options: Partial<DiffOptions> = {}): DiffNode {
  const opts: DiffOptions = { ...DEFAULT_DIFF_OPTIONS, ...options }
  return diffAt(left, right, [], opts)
}

/** Flattens a diff tree into one row per leaf-level difference, for the diff table view. */
export function flattenDiff(root: DiffNode, onlyDifferences = true): DiffTableRow[] {
  const rows: DiffTableRow[] = []
  function walk(node: DiffNode): void {
    if (node.children) {
      for (const child of node.children) walk(child)
      return
    }
    if (onlyDifferences && node.status === 'same') return
    const changeKind: DiffTableRow['changeKind'] =
      node.status === 'changed' ? (node.leftType !== node.rightType ? 'type' : 'value') : null
    rows.push({
      path: node.path,
      pathLabel: formatJsonPath(node.path),
      status: node.status,
      changeKind,
      leftPreview: node.leftPreview,
      rightPreview: node.rightPreview,
    })
  }
  walk(root)
  return rows
}
