import { describe, expect, it } from 'vitest'
import { diffValues } from './diff'
import { buildNWayRows, summarizeNWayRows } from './diff-n-way'
import type { JsonValue } from '@/types/json'

function rowAt(rows: ReturnType<typeof buildNWayRows>, path: string) {
  const row = rows.find((r) => r.pathLabel === path)
  if (!row) throw new Error(`No row for ${path}`)
  return row
}

describe('buildNWayRows', () => {
  const panels: JsonValue[] = [
    { a: 1, b: 'x', c: 'shared' },
    { a: 2, b: 'x', c: 'shared' }, // a changed vs panel 0
    { a: 1, b: 'y', d: 'new' }, // b changed, c removed, d added vs panel 0
  ]
  const pairwise = [diffValues(panels[0], panels[1]), diffValues(panels[0], panels[2])]
  const rows = buildNWayRows(pairwise, panels.length)

  it('produces one row per path across all panels', () => {
    expect(rows.map((r) => r.pathLabel).sort()).toEqual(['$.a', '$.b', '$.c', '$.d'])
  })

  it('marks a path unchanged everywhere as same', () => {
    const b = rowAt(rows, '$.b')
    // b differs in panel 2 only
    expect(b.statuses).toEqual(['same', 'same', 'changed'])
    expect(b.overallStatus).toBe('differs')
  })

  it('marks a path that differs in only one panel with that panel status and same elsewhere', () => {
    const a = rowAt(rows, '$.a')
    expect(a.statuses).toEqual(['same', 'changed', 'same'])
    expect(a.overallStatus).toBe('differs')
  })

  it('carries per-panel previews, with null where a panel lacks the key', () => {
    const c = rowAt(rows, '$.c')
    expect(c.previews).toEqual(['"shared"', '"shared"', null])
    expect(c.statuses[2]).toBe('removed')
  })

  it('surfaces a key that only exists on a non-reference panel', () => {
    const d = rowAt(rows, '$.d')
    expect(d.previews).toEqual([null, null, '"new"'])
    expect(d.statuses[2]).toBe('added')
    expect(d.statuses[1]).toBe('same') // panel 1 also lacks it, same as the reference
  })

  it('reports overall same for a path unchanged in every panel', () => {
    const morePanels = [{ x: 1 }, { x: 1 }, { x: 1 }]
    const pw = [diffValues(morePanels[0], morePanels[1]), diffValues(morePanels[0], morePanels[2])]
    const r = buildNWayRows(pw, 3)
    expect(rowAt(r, '$.x').overallStatus).toBe('same')
  })
})

describe('summarizeNWayRows', () => {
  it('counts differing vs identical rows', () => {
    const pairwise = [diffValues({ a: 1, b: 1 }, { a: 2, b: 1 })]
    const rows = buildNWayRows(pairwise, 2)
    expect(summarizeNWayRows(rows)).toEqual({ differs: 1, same: 1 })
  })
})
