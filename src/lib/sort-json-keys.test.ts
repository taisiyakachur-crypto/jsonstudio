import { describe, expect, it } from 'vitest'
import { sortJsonKeysDeep } from './sort-json-keys'

describe('sortJsonKeysDeep', () => {
  it('sorts top-level keys alphabetically', () => {
    const result = sortJsonKeysDeep({ c: 1, a: 2, b: 3 })
    expect(Object.keys(result as object)).toEqual(['a', 'b', 'c'])
  })

  it('sorts nested object keys recursively', () => {
    const result = sortJsonKeysDeep({ z: { y: 1, x: 2 }, a: 1 })
    expect(Object.keys(result as object)).toEqual(['a', 'z'])
    expect(Object.keys((result as { z: object }).z)).toEqual(['x', 'y'])
  })

  it('sorts objects nested inside arrays but preserves array order', () => {
    const result = sortJsonKeysDeep([{ b: 1, a: 2 }, { d: 1, c: 2 }])
    expect(Object.keys((result as object[])[0]!)).toEqual(['a', 'b'])
    expect(Object.keys((result as object[])[1]!)).toEqual(['c', 'd'])
  })

  it('leaves primitives untouched', () => {
    expect(sortJsonKeysDeep(42)).toBe(42)
    expect(sortJsonKeysDeep(null)).toBe(null)
    expect(sortJsonKeysDeep('x')).toBe('x')
  })
})
