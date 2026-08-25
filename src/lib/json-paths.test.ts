import { describe, expect, it } from 'vitest'
import { enumeratePaths } from './json-paths'

describe('enumeratePaths', () => {
  it('always includes the root', () => {
    const entries = enumeratePaths({ a: 1 })
    expect(entries[0]).toMatchObject({ pathLabel: '$', type: 'object' })
  })

  it('enumerates nested object and array containers, not scalar leaves', () => {
    const doc = { data: { items: [{ id: 1 }, { id: 2 }] }, count: 2 }
    const labels = enumeratePaths(doc).map((e) => e.pathLabel)
    expect(labels).toEqual(
      expect.arrayContaining(['$', '$.data', '$.data.items', '$.data.items[0]', '$.data.items[1]']),
    )
    expect(labels).not.toContain('$.count')
    expect(labels).not.toContain('$.data.items[0].id')
  })

  it('reports child counts for containers', () => {
    const entries = enumeratePaths({ items: [1, 2, 3] })
    const items = entries.find((e) => e.pathLabel === '$.items')
    expect(items).toMatchObject({ type: 'array', childCount: 3 })
  })

  it('stops descending past maxDepth', () => {
    const doc = { a: { b: { c: { d: {} } } } }
    const labels = enumeratePaths(doc, { maxDepth: 2 }).map((e) => e.pathLabel)
    expect(labels).toContain('$.a.b')
    expect(labels).not.toContain('$.a.b.c')
  })

  it('caps the number of array elements it expands into their own entries', () => {
    const doc = { items: Array.from({ length: 500 }, (_, i) => ({ id: i })) }
    const entries = enumeratePaths(doc)
    const itemEntries = entries.filter((e) => /^\$\.items\[\d+\]$/.test(e.pathLabel))
    expect(itemEntries.length).toBeLessThan(50)
  })

  it('does not descend into scalar values', () => {
    expect(enumeratePaths('just a string')).toEqual([])
    expect(enumeratePaths(42)).toEqual([])
  })

  it('respects an overall maxCount cap', () => {
    const doc: Record<string, number> = {}
    for (let i = 0; i < 100; i++) doc[`key${i}`] = i
    const entries = enumeratePaths({ nested: doc }, { maxCount: 10 })
    expect(entries.length).toBeLessThanOrEqual(10)
  })
})
