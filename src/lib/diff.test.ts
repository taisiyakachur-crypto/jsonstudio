import { describe, expect, it } from 'vitest'
import { diffValues, flattenDiff, isIgnoredKeyPath } from './diff'
import type { DiffNode } from './diff'

function leafAt(node: DiffNode, ...path: (string | number)[]): DiffNode {
  let current = node
  for (const segment of path) {
    const child = current.children?.find((c) => c.key === String(segment))
    if (!child) throw new Error(`No child ${String(segment)} under ${JSON.stringify(current.path)}`)
    current = child
  }
  return current
}

describe('diffValues: identical documents', () => {
  it('marks everything same and counts nothing else', () => {
    const doc = { a: 1, b: { c: 2 }, d: [1, 2, 3] }
    const result = diffValues(doc, structuredClone(doc))
    expect(result.status).toBe('same')
    expect(result.counts).toEqual({ added: 0, removed: 0, changed: 0, same: expect.any(Number) })
    expect(result.counts.same).toBeGreaterThan(0)
  })
})

describe('diffValues: added/removed/changed keys', () => {
  const left = { a: 1, b: 2, c: 3 }
  const right = { a: 1, b: 20, d: 4 }
  const result = diffValues(left, right)

  it('flags a key missing on the right as removed', () => {
    expect(leafAt(result, 'c').status).toBe('removed')
  })

  it('flags a key missing on the left as added', () => {
    expect(leafAt(result, 'd').status).toBe('added')
  })

  it('flags a different value as changed', () => {
    expect(leafAt(result, 'b').status).toBe('changed')
  })

  it('flags an identical value as same', () => {
    expect(leafAt(result, 'a').status).toBe('same')
  })

  it('propagates changed status up to the root', () => {
    expect(result.status).toBe('changed')
  })

  it('aggregates counts across the whole tree', () => {
    expect(result.counts).toEqual({ added: 1, removed: 1, changed: 1, same: 1 })
  })
})

describe('diffValues: nested structures', () => {
  it('propagates a deeply nested change up through every ancestor', () => {
    const left = { a: { b: { c: 1 } } }
    const right = { a: { b: { c: 2 } } }
    const result = diffValues(left, right)
    expect(result.status).toBe('changed')
    expect(leafAt(result, 'a').status).toBe('changed')
    expect(leafAt(result, 'a', 'b').status).toBe('changed')
    expect(leafAt(result, 'a', 'b', 'c').status).toBe('changed')
  })

  it('recurses into a whole added/removed subtree so every descendant is individually marked', () => {
    const left = {}
    const right = { user: { name: 'A', tags: ['x', 'y'] } }
    const result = diffValues(left, right)
    const user = leafAt(result, 'user')
    expect(user.status).toBe('added')
    expect(user.children).not.toBeNull()
    expect(leafAt(result, 'user', 'name').status).toBe('added')
    expect(leafAt(result, 'user', 'tags', '0').status).toBe('added')
    expect(result.counts.added).toBe(3) // name, tags[0], tags[1]
  })

  it('treats a container replaced by a scalar as one changed leaf, not a subtree', () => {
    const left = { a: { x: 1, y: 2 } }
    const right = { a: 'now a string' }
    const result = diffValues(left, right)
    const a = leafAt(result, 'a')
    expect(a.status).toBe('changed')
    expect(a.children).toBeNull()
  })
})

describe('diffValues: arrays by index (default)', () => {
  it('diffs elements position by position', () => {
    const result = diffValues([1, 2, 3], [1, 20, 3, 4])
    expect(leafAt(result, '0').status).toBe('same')
    expect(leafAt(result, '1').status).toBe('changed')
    expect(leafAt(result, '2').status).toBe('same')
    expect(leafAt(result, '3').status).toBe('added')
  })

  it('treats a reordered array as fully changed when order matters', () => {
    const result = diffValues(['a', 'b', 'c'], ['c', 'a', 'b'])
    expect(result.counts.same).toBe(0)
  })
})

describe('diffValues: ignoreArrayOrder', () => {
  it('matches reordered primitives regardless of position', () => {
    const result = diffValues(['a', 'b', 'c'], ['c', 'a', 'b'], { ignoreArrayOrder: true })
    expect(result.status).toBe('same')
    expect(result.counts).toEqual({ added: 0, removed: 0, changed: 0, same: 3 })
  })

  it('pairs up leftover elements positionally as a changed value, once matched elements are set aside', () => {
    // 'b' matches directly; the leftover 'a' vs 'c' is a plausible "this became that"
    // pairing rather than an unrelated remove+add -- see the comment on diffArrayUnordered.
    const result = diffValues(['a', 'b'], ['b', 'c'], { ignoreArrayOrder: true })
    expect(result.counts).toEqual({ added: 0, removed: 0, changed: 1, same: 1 })
  })

  it('reports a real addition when there is no leftover on the other side to pair with', () => {
    const result = diffValues(['a'], ['a', 'b'], { ignoreArrayOrder: true })
    expect(result.counts).toEqual({ added: 1, removed: 0, changed: 0, same: 1 })
  })

  it('reports a real removal when there is no leftover on the other side to pair with', () => {
    const result = diffValues(['a', 'b'], ['a'], { ignoreArrayOrder: true })
    expect(result.counts).toEqual({ added: 0, removed: 1, changed: 0, same: 1 })
  })
})

describe('diffValues: arrayKeyField', () => {
  const left = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ]
  const right = [
    { id: 2, name: 'Bobby' },
    { id: 3, name: 'Carol' },
    { id: 1, name: 'Alice' },
  ]

  it('matches objects by key regardless of position and diffs their contents', () => {
    const result = diffValues(left, right, { arrayKeyField: 'id' })
    expect(result.status).toBe('changed')
    // id:1 unchanged, id:2 name changed, id:3 added
    const byId1 = leafAt(result, '0') // left index 0 -> id 1
    expect(byId1.status).toBe('same')
  })

  it('reports a removed keyed element that has no counterpart', () => {
    const result = diffValues(
      [{ id: 1, v: 'x' }],
      [{ id: 2, v: 'y' }],
      { arrayKeyField: 'id' },
    )
    expect(result.counts.added).toBeGreaterThan(0)
    expect(result.counts.removed).toBeGreaterThan(0)
  })

  it('falls back to positional pairing for elements missing the key field', () => {
    const result = diffValues([{ v: 1 }], [{ v: 1 }], { arrayKeyField: 'id' })
    expect(result.status).toBe('same')
  })
})

describe('diffValues: ignoreCase', () => {
  it('treats differently-cased strings as equal when enabled', () => {
    expect(diffValues({ a: 'Hello' }, { a: 'HELLO' }, { ignoreCase: true }).status).toBe('same')
  })

  it('is case-sensitive by default', () => {
    expect(diffValues({ a: 'Hello' }, { a: 'HELLO' }).status).toBe('changed')
  })
})

describe('diffValues: ignoredKeys', () => {
  it('skips an exact key match entirely', () => {
    const result = diffValues({ id: 1, updatedAt: 't1' }, { id: 1, updatedAt: 't2' }, {
      ignoredKeys: ['updatedAt'],
    })
    expect(result.status).toBe('same')
    expect(result.children?.some((c) => c.key === 'updatedAt')).toBe(false)
  })

  it('supports a leading wildcard segment', () => {
    const left = { meta: { updatedAt: 't1' }, other: { updatedAt: 't1' } }
    const right = { meta: { updatedAt: 't2' }, other: { updatedAt: 't2' } }
    const result = diffValues(left, right, { ignoredKeys: ['*.updatedAt'] })
    expect(result.status).toBe('same')
  })

  it('supports a trailing wildcard segment', () => {
    const left = { meta: { a: 1, b: 2 } }
    const right = { meta: { a: 99, b: 99 } }
    const result = diffValues(left, right, { ignoredKeys: ['meta.*'] })
    expect(result.status).toBe('same')
  })
})

describe('isIgnoredKeyPath', () => {
  it('matches the documented examples', () => {
    expect(isIgnoredKeyPath(['meta', 'updatedAt'], ['*.updatedAt'])).toBe(true)
    expect(isIgnoredKeyPath(['a', 'meta', 'updatedAt'], ['*.updatedAt'])).toBe(true)
    expect(isIgnoredKeyPath(['meta', 'x'], ['meta.*'])).toBe(true)
    expect(isIgnoredKeyPath(['other', 'x'], ['meta.*'])).toBe(false)
  })

  it('does not match when there is no pattern configured', () => {
    expect(isIgnoredKeyPath(['a'], [])).toBe(false)
  })
})

describe('diffValues: treatNullEmptyMissingAsEqual', () => {
  it('treats a missing key and null as equal', () => {
    expect(diffValues({}, { a: null }, { treatNullEmptyMissingAsEqual: true }).status).toBe('same')
  })

  it('treats null and empty string as equal', () => {
    expect(diffValues({ a: null }, { a: '' }, { treatNullEmptyMissingAsEqual: true }).status).toBe('same')
  })

  it('treats a missing key and empty string as equal', () => {
    expect(diffValues({}, { a: '' }, { treatNullEmptyMissingAsEqual: true }).status).toBe('same')
  })

  it('does not apply when the option is off', () => {
    expect(diffValues({}, { a: null }).status).toBe('changed')
  })
})

describe('diffValues: numericTolerance', () => {
  it('treats numbers within tolerance as equal', () => {
    expect(diffValues({ a: 1.001 }, { a: 1.002 }, { numericTolerance: 0.01 }).status).toBe('same')
  })

  it('still flags numbers outside the tolerance', () => {
    expect(diffValues({ a: 1 }, { a: 2 }, { numericTolerance: 0.5 }).status).toBe('changed')
  })
})

describe('diffValues: ignoreTypes', () => {
  it('treats a numeric string and a number as equal', () => {
    expect(diffValues({ a: '1' }, { a: 1 }, { ignoreTypes: true }).status).toBe('same')
  })

  it('still respects numeric tolerance when comparing across types', () => {
    expect(diffValues({ a: '1.001' }, { a: 1.002 }, { ignoreTypes: true, numericTolerance: 0.01 }).status).toBe(
      'same',
    )
  })

  it('falls back to string comparison for non-numeric values', () => {
    expect(diffValues({ a: true }, { a: 'true' }, { ignoreTypes: true }).status).toBe('same')
  })
})

describe('flattenDiff', () => {
  const result = diffValues({ a: 1, b: 2, c: 3 }, { a: 1, b: 20, d: 4 })

  it('lists only differing leaves by default', () => {
    const rows = flattenDiff(result)
    expect(rows).toHaveLength(3)
    expect(rows.map((r) => r.pathLabel).sort()).toEqual(['$.b', '$.c', '$.d'])
  })

  it('includes same rows when onlyDifferences is false', () => {
    const rows = flattenDiff(result, false)
    expect(rows).toHaveLength(4)
  })

  it('classifies a same-type change as a value change', () => {
    const rows = flattenDiff(result)
    const bRow = rows.find((r) => r.pathLabel === '$.b')
    expect(bRow?.changeKind).toBe('value')
  })

  it('classifies a cross-type change distinctly from a same-type change', () => {
    const typeChangeResult = diffValues({ a: 1 }, { a: 'one' })
    const rows = flattenDiff(typeChangeResult)
    expect(rows[0]?.changeKind).toBe('type')
  })

  it('leaves changeKind null for added/removed rows', () => {
    const rows = flattenDiff(result)
    const dRow = rows.find((r) => r.pathLabel === '$.d')
    expect(dRow?.changeKind).toBeNull()
  })
})
