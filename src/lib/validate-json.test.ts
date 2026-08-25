import { describe, expect, it } from 'vitest'
import { validateJson } from './validate-json'

describe('validateJson strict mode', () => {
  it('accepts well-formed JSON', () => {
    const result = validateJson('{"a": 1, "b": [1, 2]}', false, 'uk')
    expect(result.valid).toBe(true)
    expect(result.value).toEqual({ a: 1, b: [1, 2] })
  })

  it('treats empty input as valid (neutral)', () => {
    expect(validateJson('   ', false, 'uk').valid).toBe(true)
  })

  it('reports a missing comma in Ukrainian with a line/column', () => {
    const result = validateJson('{\n  "a": 1\n  "b": 2\n}', false, 'uk')
    expect(result.valid).toBe(false)
    expect(result.error?.line).toBe(3)
    expect(result.error?.message).toContain('Рядок 3')
    expect(result.error?.message).toContain('кома')
  })

  it('reports the same error in English', () => {
    const result = validateJson('{\n  "a": 1\n  "b": 2\n}', false, 'en')
    expect(result.error?.message).toContain('Line 3')
    expect(result.error?.message.toLowerCase()).toContain('comma')
  })

  it('rejects trailing commas and comments in strict mode', () => {
    expect(validateJson('{"a": 1,}', false, 'uk').valid).toBe(false)
    expect(validateJson('{"a": 1 /* x */}', false, 'uk').valid).toBe(false)
  })
})

describe('validateJson soft (JSON5) mode', () => {
  it('accepts comments, trailing commas and unquoted keys', () => {
    const result = validateJson('{ a: 1, b: 2, /* trailing */ }', true, 'uk')
    expect(result.valid).toBe(true)
    expect(result.value).toEqual({ a: 1, b: 2 })
  })

  it('accepts single-quoted strings', () => {
    expect(validateJson("{ 'a': 'x' }", true, 'uk').valid).toBe(true)
  })

  it('still rejects genuinely broken input', () => {
    const result = validateJson('{ a: }', true, 'uk')
    expect(result.valid).toBe(false)
    expect(result.error?.line).toBeGreaterThan(0)
  })
})
