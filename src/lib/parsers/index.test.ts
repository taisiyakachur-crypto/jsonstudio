import { describe, expect, it } from 'vitest'
import { parseByFormat } from './index'

describe('parseByFormat', () => {
  it('dispatches to the requested format', () => {
    expect(parseByFormat('a=1&b=2', 'query-string')).toEqual({ a: '1', b: '2' })
    expect(parseByFormat('name,age\nJohn,30', 'csv')).toEqual([{ name: 'John', age: 30 }])
  })

  it('resolves "auto" via detection', () => {
    expect(parseByFormat('{"a":1}', 'auto')).toEqual({ a: 1 })
  })

  it('honors a custom CSV delimiter', () => {
    expect(parseByFormat('a\tb\n1\t2', 'csv', { csvDelimiter: '\t' })).toEqual([{ a: 1, b: 2 }])
  })

  it('propagates a ParseInputError with a human message', () => {
    expect(() => parseByFormat('not xml at all {', 'xml')).toThrow()
  })
})
