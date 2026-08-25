import { describe, expect, it } from 'vitest'
import { escapeJsonToString } from './escape-json'
import { parseEscapedJsonString } from './escaped-json'

describe('escapeJsonToString', () => {
  it('produces a quoted, escaped string literal', () => {
    const result = escapeJsonToString({ id: 1 })
    expect(result).toBe('"{\\"id\\":1}"')
  })

  it('round-trips through parseEscapedJsonString', () => {
    const value = { a: 1, b: ['x', 'y'], c: null }
    expect(parseEscapedJsonString(escapeJsonToString(value))).toEqual(value)
  })

  it('applies the given indentation before escaping', () => {
    const result = escapeJsonToString({ a: 1 }, 2)
    expect(result).toContain('\\n')
  })
})
