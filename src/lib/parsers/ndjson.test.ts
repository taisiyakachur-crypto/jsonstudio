import { describe, expect, it } from 'vitest'
import { parseNdjson } from './ndjson'

describe('parseNdjson', () => {
  it('parses one JSON value per line into an array', () => {
    expect(parseNdjson('{"a":1}\n{"a":2}')).toEqual([{ a: 1 }, { a: 2 }])
  })

  it('skips blank lines', () => {
    expect(parseNdjson('{"a":1}\n\n{"a":2}\n')).toEqual([{ a: 1 }, { a: 2 }])
  })

  it('throws with the offending line number', () => {
    expect(() => parseNdjson('{"a":1}\nnot json')).toThrow(/Рядок 2/)
  })

  it('throws for empty input', () => {
    expect(() => parseNdjson('   ')).toThrow()
  })
})
