import { isJsonArray, isJsonObject, type JsonValue } from '@/types/json'

export interface JsonBranchSize {
  key: string
  bytes: number
}

export interface JsonStats {
  nodeCount: number
  maxDepth: number
  uniqueKeys: string[]
  /** Top-level branches (object keys or array indices), largest serialized size first. */
  largestBranches: JsonBranchSize[]
}

function walk(value: JsonValue, depth: number, uniqueKeys: Set<string>, countNode: () => void): number {
  countNode()
  if (isJsonArray(value)) {
    let max = depth
    for (const item of value) {
      max = Math.max(max, walk(item, depth + 1, uniqueKeys, countNode))
    }
    return max
  }
  if (isJsonObject(value)) {
    let max = depth
    for (const key of Object.keys(value)) {
      uniqueKeys.add(key)
      max = Math.max(max, walk(value[key] as JsonValue, depth + 1, uniqueKeys, countNode))
    }
    return max
  }
  return depth
}

const MAX_LARGEST_BRANCHES = 10

export function computeJsonStats(value: JsonValue): JsonStats {
  let nodeCount = 0
  const uniqueKeys = new Set<string>()
  const maxDepth = walk(value, 1, uniqueKeys, () => nodeCount++)

  let largestBranches: JsonBranchSize[] = []
  if (isJsonObject(value)) {
    largestBranches = Object.entries(value).map(([key, v]) => ({
      key,
      bytes: new Blob([JSON.stringify(v)]).size,
    }))
  } else if (isJsonArray(value)) {
    largestBranches = value.map((v, i) => ({
      key: String(i),
      bytes: new Blob([JSON.stringify(v)]).size,
    }))
  }
  largestBranches.sort((a, b) => b.bytes - a.bytes)
  largestBranches = largestBranches.slice(0, MAX_LARGEST_BRANCHES)

  return { nodeCount, maxDepth, uniqueKeys: [...uniqueKeys].sort((a, b) => a.localeCompare(b)), largestBranches }
}
