import { describe, expect, it } from 'vitest'
import { computeJsonStats } from './json-stats'

describe('computeJsonStats', () => {
  it('counts every node, root included', () => {
    // root object + 2 leaf values = 3 nodes
    expect(computeJsonStats({ a: 1, b: 2 }).nodeCount).toBe(3)
  })

  it('computes max nesting depth (root counts as depth 1)', () => {
    expect(computeJsonStats({ a: { b: { c: 1 } } }).maxDepth).toBe(4)
    expect(computeJsonStats(42).maxDepth).toBe(1)
  })

  it('collects unique keys across the whole document, sorted', () => {
    const stats = computeJsonStats({ a: { z: 1 }, b: { a: 1, m: 1 } })
    expect(stats.uniqueKeys).toEqual(['a', 'b', 'm', 'z'])
  })

  it('ranks top-level branches by serialized size, largest first', () => {
    const stats = computeJsonStats({ small: 1, big: 'x'.repeat(100) })
    expect(stats.largestBranches[0]?.key).toBe('big')
    expect(stats.largestBranches[1]?.key).toBe('small')
  })

  it('ranks array indices as branches for array roots', () => {
    const stats = computeJsonStats(['x'.repeat(50), 'y'])
    expect(stats.largestBranches[0]?.key).toBe('0')
  })
})
