import { describe, expect, it } from 'vitest'
import { beautifyLoose } from './beautify-loose'

describe('beautifyLoose', () => {
  it('reindents already-valid JSON the standard way', () => {
    expect(beautifyLoose('{"a":1,"b":[1,2]}')).toBe('{\n  "a": 1,\n  "b": [\n    1,\n    2\n  ]\n}')
  })

  it('never adds a missing closing bracket', () => {
    const out = beautifyLoose('{"a": 1, "b": 2')
    expect(out).toBe('{\n  "a": 1,\n  "b": 2')
    expect(out.includes('}')).toBe(false)
  })

  it('never closes an unterminated string', () => {
    const out = beautifyLoose('{"a": "hello')
    expect(out).toBe('{\n  "a": "hello')
  })

  it('keeps a bare object body unwrapped -- no braces added', () => {
    const out = beautifyLoose('"a": 1, "b": 2')
    expect(out.startsWith('{')).toBe(false)
    expect(out).toBe('"a": 1,\n"b": 2')
  })

  it('carries a decorative separator line through on its own line, unmodified', () => {
    const input = '"a": [1, 2],\n----------------\n"b": [3, 4]'
    const out = beautifyLoose(input)
    expect(out).toContain('----------------')
    expect(out.split('\n')).toContain('----------------')
  })

  it('does not drop a dangling key with no value', () => {
    const out = beautifyLoose('{"a": 1, "b":')
    expect(out).toBe('{\n  "a": 1,\n  "b":')
  })

  it('does not drop a dangling bare key with no colon', () => {
    const out = beautifyLoose('{"a": 1, "b')
    expect(out).toBe('{\n  "a": 1,\n  "b')
  })

  it('preserves trailing garbage after a value completes', () => {
    const out = beautifyLoose('{"a": 1} some extra text')
    expect(out).toContain('some')
    expect(out).toContain('extra')
    expect(out).toContain('text')
  })

  it('collapses runs of whitespace between tokens to its own layout', () => {
    expect(beautifyLoose('{   "a"    :     1   }')).toBe('{\n  "a": 1\n}')
  })

  it('keeps a stray closing bracket with nothing open above it', () => {
    const out = beautifyLoose('{"a": 1}}')
    expect(out.match(/}/g)).toHaveLength(2)
  })

  it('handles empty input', () => {
    expect(beautifyLoose('')).toBe('')
  })
})
