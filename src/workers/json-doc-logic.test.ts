import { describe, expect, it } from 'vitest'
import type { JsonValue } from '@/types/json'
import { buildMeta, computeChildren, describeValue, resolvePath } from './json-doc-logic'

const sample: JsonValue = {
  users: [
    { id: 1, name: 'Олена', tags: ['vip', 'active'] },
    { id: 2, name: 'Іван', tags: [] },
    { id: 3, name: 'Марія', tags: ['trial'] },
  ],
  meta: { total: 3, generatedAt: '2026-01-01' },
}

describe('resolvePath', () => {
  it('returns the root for an empty path', () => {
    expect(resolvePath(sample, [])).toBe(sample)
  })

  it('walks object keys and array indices', () => {
    expect(resolvePath(sample, ['users', 1, 'name'])).toBe('Іван')
  })

  it('returns undefined for a path into a scalar', () => {
    expect(resolvePath(sample, ['meta', 'total', 'x'])).toBeUndefined()
  })

  it('returns undefined for an out-of-range index', () => {
    expect(resolvePath(sample, ['users', 99])).toBeUndefined()
  })
})

describe('describeValue', () => {
  it('describes arrays with their length', () => {
    expect(describeValue([1, 2, 3])).toMatchObject({ type: 'array', hasChildren: true, childCount: 3 })
  })

  it('describes an empty object as childless', () => {
    expect(describeValue({})).toMatchObject({ type: 'object', hasChildren: false, childCount: 0 })
  })

  it('truncates long strings in the preview', () => {
    const long = 'x'.repeat(200)
    const { preview } = describeValue(long)
    expect(preview.length).toBeLessThan(long.length)
    expect(preview.endsWith('…"')).toBe(true)
  })

  it('previews primitives verbatim', () => {
    expect(describeValue(42)).toMatchObject({ preview: '42', hasChildren: false })
    expect(describeValue(null)).toMatchObject({ preview: 'null', type: 'null' })
  })
})

describe('computeChildren', () => {
  it('lists root-level entries', () => {
    const page = computeChildren(sample, [], 0, 10)
    expect(page.total).toBe(2)
    expect(page.items.map((i) => i.key)).toEqual(['users', 'meta'])
  })

  it('paginates with offset/limit', () => {
    const page = computeChildren(sample, ['users'], 1, 1)
    expect(page.total).toBe(3)
    expect(page.items).toHaveLength(1)
    expect(page.items[0]?.key).toBe('1')
    expect(page.items[0]?.path).toEqual(['users', 1])
  })

  it('returns an empty page for a path into a scalar', () => {
    expect(computeChildren(sample, ['meta', 'total'], 0, 10)).toEqual({ items: [], total: 0 })
  })

  it('returns an empty page when the document is missing', () => {
    expect(computeChildren(undefined, [], 0, 10)).toEqual({ items: [], total: 0 })
  })
})

describe('buildMeta', () => {
  it('flags documents over the editor size limit as large', () => {
    const meta = buildMeta('doc1', sample, 3 * 1024 * 1024, JSON.stringify(sample))
    expect(meta.isLarge).toBe(true)
    expect(meta.rootType).toBe('object')
    expect(meta.rootChildCount).toBe(2)
  })

  it('does not flag small documents as large', () => {
    const meta = buildMeta('doc2', sample, 500, JSON.stringify(sample))
    expect(meta.isLarge).toBe(false)
  })
})
