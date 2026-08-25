import { flattenDiff } from './diff'
import type { DiffNode, DiffStatus } from './diff'
import { formatJsonPath } from './json-path'
import type { JsonPathSegment } from '@/types/json-doc'

/**
 * Compares more than two documents by picking the first panel as the reference and running the
 * pairwise engine in `diff.ts` once per other panel (`diffValues(panels[0], panels[i])`). This
 * reuses the fully-tested pairwise algorithm as-is instead of generalizing every option
 * (`arrayKeyField`, the unordered-array matching heuristic, ...) to N-ary inputs, at the cost of
 * always diffing "against panel 1" rather than a true all-pairs comparison.
 */
export interface NWayRow {
  path: JsonPathSegment[]
  pathLabel: string
  /** One entry per panel, index-aligned; `null` means that panel doesn't have this path. */
  previews: (string | null)[]
  /** Per-panel status relative to the reference (panel 0); the reference's own slot is always `same`. */
  statuses: DiffStatus[]
  overallStatus: 'same' | 'differs'
  changeKind: 'value' | 'type' | null
}

function pathKeyOf(path: JsonPathSegment[]): string {
  return JSON.stringify(path)
}

/**
 * Returns one row per path that exists in any panel, `same` rows included -- filter those out
 * at the call site (consistent with how `DiffTableView` filters client-side too).
 *
 * @param pairwiseResults `diffValues(panels[0], panels[i])` for each `i` from 1 to N-1, in order.
 * @param panelCount Total number of panels (`pairwiseResults.length + 1`).
 */
export function buildNWayRows(pairwiseResults: DiffNode[], panelCount: number): NWayRow[] {
  interface Entry {
    path: JsonPathSegment[]
    previews: (string | null)[]
    statuses: DiffStatus[]
    hasTypeChange: boolean
  }
  const byPath = new Map<string, Entry>()

  function entryFor(path: JsonPathSegment[]): Entry {
    const key = pathKeyOf(path)
    let entry = byPath.get(key)
    if (!entry) {
      entry = {
        path,
        previews: new Array(panelCount).fill(null),
        statuses: new Array(panelCount).fill('same'),
        hasTypeChange: false,
      }
      byPath.set(key, entry)
    }
    return entry
  }

  pairwiseResults.forEach((root, i) => {
    const panelIndex = i + 1
    for (const row of flattenDiff(root, false)) {
      const entry = entryFor(row.path)
      entry.previews[0] = row.leftPreview
      entry.previews[panelIndex] = row.rightPreview
      entry.statuses[panelIndex] = row.status
      if (row.changeKind === 'type') entry.hasTypeChange = true
    }
  })

  const rows: NWayRow[] = []
  for (const entry of byPath.values()) {
    const overallStatus: 'same' | 'differs' = entry.statuses.slice(1).some((s) => s !== 'same')
      ? 'differs'
      : 'same'
    rows.push({
      path: entry.path,
      pathLabel: formatJsonPath(entry.path),
      previews: entry.previews,
      statuses: entry.statuses,
      overallStatus,
      changeKind: overallStatus === 'differs' ? (entry.hasTypeChange ? 'type' : 'value') : null,
    })
  }
  rows.sort((a, b) => a.pathLabel.localeCompare(b.pathLabel))
  return rows
}

export interface NWaySummary {
  differs: number
  same: number
}

export function summarizeNWayRows(allRows: NWayRow[]): NWaySummary {
  let differs = 0
  let same = 0
  for (const row of allRows) {
    if (row.overallStatus === 'differs') differs++
    else same++
  }
  return { differs, same }
}
