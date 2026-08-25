import { describe, expect, it } from 'vitest'
import { parseKeyValueLines } from './key-value'

describe('parseKeyValueLines', () => {
  it('parses colon-separated lines', () => {
    expect(parseKeyValueLines('name: John\nage: 30')).toEqual({ name: 'John', age: 30 })
  })

  it('parses equals-separated lines', () => {
    expect(parseKeyValueLines('NAME=John\nDEBUG=true')).toEqual({ NAME: 'John', DEBUG: true })
  })

  it('coerces booleans, numbers and null', () => {
    expect(parseKeyValueLines('a: true\nb: false\nc: null\nd: 3.5')).toEqual({
      a: true,
      b: false,
      c: null,
      d: 3.5,
    })
  })

  it('skips blank lines and comments', () => {
    expect(parseKeyValueLines('# comment\n\nname: John\n// also a comment\nage: 30')).toEqual({
      name: 'John',
      age: 30,
    })
  })

  it('throws when no line matches the pattern', () => {
    expect(() => parseKeyValueLines('just some prose')).toThrow()
  })
})
