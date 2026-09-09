import { describe, expect, it } from 'vitest'
import { stringifyWithHighlights } from './stringify-with-highlights'

describe('stringifyWithHighlights', () => {
  it('matches JSON.stringify(value, null, 2) when nothing is synthetic', () => {
    const value = { a: 1, b: [1, 2, { c: 'x' }] }
    const { text, ranges } = stringifyWithHighlights(value, [], '  ')
    expect(text).toBe(JSON.stringify(value, null, 2))
    expect(ranges).toEqual([])
  })

  it('matches compact JSON.stringify(value) when indentUnit is empty', () => {
    const value = { a: 1, b: [1, 2] }
    const { text } = stringifyWithHighlights(value, [], '')
    expect(text).toBe(JSON.stringify(value))
  })

  it('reports the exact range of a top-level synthetic value', () => {
    const value = { a: 1, b: null }
    const { text, ranges } = stringifyWithHighlights(value, [['b']], '  ')
    expect(ranges).toHaveLength(1)
    const { start, end } = ranges[0]!
    expect(text.slice(start, end)).toBe('null')
  })

  it('reports the exact range of a nested synthetic value', () => {
    const value = { a: { b: { c: null } } }
    const { text, ranges } = stringifyWithHighlights(value, [['a', 'b', 'c']], '  ')
    expect(ranges).toHaveLength(1)
    const { start, end } = ranges[0]!
    expect(text.slice(start, end)).toBe('null')
    // and it's the one nested three levels deep, not some other coincidental "null"
    expect(text.slice(0, start)).toContain('"c":')
  })

  it('does not confuse a synthetic null with a real null at another path', () => {
    const value = { real: null, fake: null }
    const { text, ranges } = stringifyWithHighlights(value, [['fake']], '  ')
    expect(ranges).toHaveLength(1)
    const { start, end } = ranges[0]!
    expect(text.slice(start, end)).toBe('null')
    expect(text.slice(0, start)).toContain('"fake":')
    expect(text.slice(0, start)).not.toMatch(/"real":\s*$/)
  })

  it('produces no ranges for a path that does not exist in the value', () => {
    const value = { a: 1 }
    const { ranges } = stringifyWithHighlights(value, [['nonexistent']], '  ')
    expect(ranges).toEqual([])
  })
})
