import { describe, expect, it } from 'vitest'
import { lineColumnToOffset, offsetToLineColumn } from './text-position'

describe('offsetToLineColumn', () => {
  it('finds line 1 column 1 at offset 0', () => {
    expect(offsetToLineColumn('abc', 0)).toEqual({ line: 1, column: 1 })
  })

  it('advances line and resets column after a newline', () => {
    const text = 'ab\ncd\nef'
    expect(offsetToLineColumn(text, 4)).toEqual({ line: 2, column: 2 }) // 'd'
    expect(offsetToLineColumn(text, 6)).toEqual({ line: 3, column: 1 }) // 'e'
  })

  it('clamps offsets past the end of the text', () => {
    expect(offsetToLineColumn('abc', 100)).toEqual({ line: 1, column: 4 })
  })
})

describe('lineColumnToOffset', () => {
  it('round-trips with offsetToLineColumn', () => {
    const text = 'first\nsecond\nthird line'
    for (const offset of [0, 3, 6, 12, 20]) {
      const { line, column } = offsetToLineColumn(text, offset)
      expect(lineColumnToOffset(text, line, column)).toBe(offset)
    }
  })
})
