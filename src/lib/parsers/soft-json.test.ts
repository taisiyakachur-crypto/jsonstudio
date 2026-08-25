import { describe, expect, it } from 'vitest'
import { parseSoftJson } from './soft-json'

describe('parseSoftJson', () => {
  it('parses strict JSON too', () => {
    expect(parseSoftJson('{"a":1}')).toEqual({ a: 1 })
  })

  it('allows comments, trailing commas and unquoted keys', () => {
    expect(parseSoftJson('{ a: 1, b: 2, /* x */ }')).toEqual({ a: 1, b: 2 })
  })

  it('allows single-quoted strings', () => {
    expect(parseSoftJson("{ 'a': 'x' }")).toEqual({ a: 'x' })
  })

  it('throws for genuinely broken input', () => {
    expect(() => parseSoftJson('{ a: }')).toThrow()
  })
})
