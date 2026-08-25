import { describe, expect, it } from 'vitest'
import { parseQueryString } from './query-string'

describe('parseQueryString', () => {
  it('parses simple key=value pairs', () => {
    expect(parseQueryString('a=1&c=3')).toEqual({ a: '1', c: '3' })
  })

  it('collects repeated key[] into an array', () => {
    expect(parseQueryString('a=1&b[]=2&b[]=3')).toEqual({ a: '1', b: ['2', '3'] })
  })

  it('builds a nested object from bracket notation', () => {
    expect(parseQueryString('user[name]=John&user[age]=30')).toEqual({
      user: { name: 'John', age: '30' },
    })
  })

  it('decodes percent-encoding and + as space', () => {
    expect(parseQueryString('q=hello+world&x=a%26b')).toEqual({ q: 'hello world', x: 'a&b' })
  })

  it('strips a leading question mark', () => {
    expect(parseQueryString('?a=1')).toEqual({ a: '1' })
  })

  it('throws for text with neither = nor &', () => {
    expect(() => parseQueryString('just text')).toThrow()
  })

  it('throws for empty input', () => {
    expect(() => parseQueryString('   ')).toThrow()
  })
})
