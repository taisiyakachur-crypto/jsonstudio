import { describe, expect, it } from 'vitest'
import { repairJson } from './repair-json'

describe('repairJson', () => {
  it('returns undefined for empty input', () => {
    expect(repairJson('')).toBeUndefined()
    expect(repairJson('   ')).toBeUndefined()
  })

  it('leaves already-valid JSON untouched', () => {
    expect(repairJson('{"a":1,"b":[1,2,3]}')).toEqual({ a: 1, b: [1, 2, 3] })
  })

  it('closes a missing closing brace', () => {
    expect(repairJson('{"a": 1, "b": 2')).toEqual({ a: 1, b: 2 })
  })

  it('closes a missing closing bracket and brace, nested', () => {
    expect(repairJson('{"a": [1, 2, 3')).toEqual({ a: [1, 2, 3] })
  })

  it('closes an unterminated string', () => {
    expect(repairJson('{"a": "hello')).toEqual({ a: 'hello' })
  })

  it('closes an unterminated string nested in an array', () => {
    expect(repairJson('["a", "b')).toEqual(['a', 'b'])
  })

  it('strips a dangling key with a colon and no value', () => {
    expect(repairJson('{"a": 1, "b":')).toEqual({ a: 1 })
  })

  it('strips a dangling bare key with no colon', () => {
    expect(repairJson('{"a": 1, "b')).toEqual({ a: 1 })
  })

  it('strips a trailing comma with nothing after it', () => {
    expect(repairJson('{"a": 1, "b": 2,')).toEqual({ a: 1, b: 2 })
  })

  it('drops trailing garbage after the top-level object completes', () => {
    expect(repairJson('{"a": 1} some extra logging output here')).toEqual({ a: 1 })
  })

  it('drops trailing garbage after the top-level array completes', () => {
    expect(repairJson('[1, 2, 3] <- trailing note')).toEqual([1, 2, 3])
  })

  it('drops trailing garbage after a top-level string completes', () => {
    expect(repairJson('"hello" extra text after')).toBe('hello')
  })

  it('skips leading prose before the first bracket', () => {
    expect(repairJson('Response: {"ok": true}')).toEqual({ ok: true })
  })

  it('strips // line comments outside strings', () => {
    expect(repairJson('{\n  "a": 1, // trailing comment\n  "b": 2\n}')).toEqual({ a: 1, b: 2 })
  })

  it('strips /* block */ comments outside strings', () => {
    expect(repairJson('{ "a": /* inline */ 1, "b": 2 }')).toEqual({ a: 1, b: 2 })
  })

  it('does not treat // inside a string value as a comment', () => {
    expect(repairJson('{"url": "https://example.test"}')).toEqual({ url: 'https://example.test' })
  })

  it('handles multiple missing closers with a dangling member at the deepest level', () => {
    expect(repairJson('{"a": {"b": 1, "c":')).toEqual({ a: { b: 1 } })
  })

  it('returns undefined for text that never resolves to valid JSON', () => {
    expect(repairJson('just a sentence with no JSON in it at all')).toBeUndefined()
  })
})
