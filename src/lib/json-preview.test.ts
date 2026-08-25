import { describe, expect, it } from 'vitest'
import { previewJsonValue } from './json-preview'

describe('previewJsonValue', () => {
  it('previews arrays and objects by size', () => {
    expect(previewJsonValue([1, 2, 3])).toBe('[3]')
    expect(previewJsonValue({ a: 1, b: 2 })).toBe('{2}')
  })

  it('previews primitives verbatim', () => {
    expect(previewJsonValue(42)).toBe('42')
    expect(previewJsonValue(true)).toBe('true')
    expect(previewJsonValue(null)).toBe('null')
    expect(previewJsonValue('hi')).toBe('"hi"')
  })

  it('truncates long strings with an ellipsis', () => {
    const long = 'x'.repeat(200)
    const preview = previewJsonValue(long)
    expect(preview.length).toBeLessThan(long.length)
    expect(preview.endsWith('…"')).toBe(true)
  })
})
