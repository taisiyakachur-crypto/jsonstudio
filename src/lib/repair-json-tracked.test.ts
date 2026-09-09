import { describe, expect, it } from 'vitest'
import { repairJsonTracked } from './repair-json-tracked'

describe('repairJsonTracked', () => {
  it('leaves already-valid JSON untouched with no synthetic paths', () => {
    const result = repairJsonTracked('{"a":1,"b":[1,2,3]}')
    expect(result?.value).toEqual({ a: 1, b: [1, 2, 3] })
    expect(result?.syntheticPaths).toEqual([])
  })

  it('closes a missing brace without inserting anything when the last member is complete', () => {
    const result = repairJsonTracked('{"a": 1, "b": 2')
    expect(result?.value).toEqual({ a: 1, b: 2 })
    expect(result?.syntheticPaths).toEqual([])
  })

  it('completes a dangling key with a colon and no value, instead of dropping it', () => {
    const result = repairJsonTracked('{"a": 1, "b":')
    expect(result?.value).toEqual({ a: 1, b: null })
    expect(result?.syntheticPaths).toEqual([['b']])
  })

  it('completes a dangling key with only trailing whitespace after the colon', () => {
    const result = repairJsonTracked('{"a": 1, "b":   ')
    expect(result?.value).toEqual({ a: 1, b: null })
    expect(result?.syntheticPaths).toEqual([['b']])
  })

  it('completes a bare dangling key with no colon at all, instead of dropping it', () => {
    const result = repairJsonTracked('{"a": 1, "b')
    expect(result?.value).toEqual({ a: 1, b: null })
    expect(result?.syntheticPaths).toEqual([['b']])
  })

  it('tracks a nested dangling key by its full path', () => {
    const result = repairJsonTracked('{"a": {"b": 1, "c":')
    expect(result?.value).toEqual({ a: { b: 1, c: null } })
    expect(result?.syntheticPaths).toEqual([['a', 'c']])
  })

  it('only flags the innermost frame when every open frame ends on its own dangling key', () => {
    const result = repairJsonTracked('{"a": {"b": {"c":')
    expect(result?.value).toEqual({ a: { b: { c: null } } })
    expect(result?.syntheticPaths).toEqual([['a', 'b', 'c']])
  })

  it('does not insert a placeholder when a real (if incomplete) value was already typed', () => {
    const result = repairJsonTracked('{"a": {"b": 1, "c": 2')
    expect(result?.value).toEqual({ a: { b: 1, c: 2 } })
    expect(result?.syntheticPaths).toEqual([])
  })

  it('leaves a trailing comma alone -- JSON5 allows it, nothing to repair', () => {
    const result = repairJsonTracked('{"a": 1, "b": 2,')
    expect(result?.value).toEqual({ a: 1, b: 2 })
    expect(result?.syntheticPaths).toEqual([])
  })

  it('closes an unterminated string value without treating it as dangling', () => {
    const result = repairJsonTracked('{"a": "hello')
    expect(result?.value).toEqual({ a: 'hello' })
    expect(result?.syntheticPaths).toEqual([])
  })

  it('wraps a bare object body missing its outer braces', () => {
    const result = repairJsonTracked('"a": 1, "b": 2')
    expect(result?.value).toEqual({ a: 1, b: 2 })
    expect(result?.syntheticPaths).toEqual([])
  })

  it('wraps a bare object body and still completes its own dangling tail', () => {
    const result = repairJsonTracked('"a": 1, "b":')
    expect(result?.value).toEqual({ a: 1, b: null })
    expect(result?.syntheticPaths).toEqual([['b']])
  })

  it('strips a decorative separator line between members', () => {
    const input = '{\n  "a": [1, 2],\n  ----------------\n  "b": [3, 4]\n}'
    const result = repairJsonTracked(input)
    expect(result?.value).toEqual({ a: [1, 2], b: [3, 4] })
    expect(result?.syntheticPaths).toEqual([])
  })

  it('returns undefined for text that never resolves to valid JSON', () => {
    expect(repairJsonTracked('just a sentence with no JSON in it at all')).toBeUndefined()
  })

  it('returns undefined for empty input', () => {
    expect(repairJsonTracked('')).toBeUndefined()
  })
})
