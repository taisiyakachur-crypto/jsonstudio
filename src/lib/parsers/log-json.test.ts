import { describe, expect, it } from 'vitest'
import { parseJsonFromLogLine } from './log-json'

describe('parseJsonFromLogLine', () => {
  it('extracts a JSON object surrounded by log noise', () => {
    const line = '2026-01-01 12:00:00 INFO Got response: {"id":1,"ok":true} done in 4ms'
    expect(parseJsonFromLogLine(line)).toEqual({ id: 1, ok: true })
  })

  it('extracts a JSON array', () => {
    expect(parseJsonFromLogLine('payload=[1,2,3] end')).toEqual([1, 2, 3])
  })

  it('respects braces inside string values', () => {
    const line = 'body: {"msg":"has a } brace inside"}'
    expect(parseJsonFromLogLine(line)).toEqual({ msg: 'has a } brace inside' })
  })

  it('handles nested objects', () => {
    const line = 'x {"a":{"b":{"c":1}}} y'
    expect(parseJsonFromLogLine(line)).toEqual({ a: { b: { c: 1 } } })
  })

  it('throws when there is no bracket at all', () => {
    expect(() => parseJsonFromLogLine('no json here')).toThrow()
  })

  it('throws when brackets never balance', () => {
    expect(() => parseJsonFromLogLine('broken: {"a":1')).toThrow()
  })
})
