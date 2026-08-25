import { describe, expect, it } from 'vitest'
import { formatJson, minifyJson } from './format-json'

const value = { b: 2, a: [1, 2] }

describe('formatJson', () => {
  it('defaults to 2-space indentation', () => {
    expect(formatJson(value)).toBe('{\n  "b": 2,\n  "a": [\n    1,\n    2\n  ]\n}')
  })

  it('supports 4-space indentation', () => {
    expect(formatJson(value, '4')).toContain('\n    "b": 2')
  })

  it('supports tab indentation', () => {
    expect(formatJson(value, 'tab')).toContain('\n\t"b": 2')
  })

  it('returns an empty string for undefined', () => {
    expect(formatJson(undefined)).toBe('')
  })
})

describe('minifyJson', () => {
  it('strips all whitespace', () => {
    expect(minifyJson(value)).toBe('{"b":2,"a":[1,2]}')
  })

  it('returns an empty string for undefined', () => {
    expect(minifyJson(undefined)).toBe('')
  })
})
