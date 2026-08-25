import { describe, expect, it } from 'vitest'
import { detectFormat } from './detect'

describe('detectFormat', () => {
  it('recognizes a JWT', () => {
    expect(detectFormat('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abc123')).toBe('jwt')
  })

  it('recognizes an escaped JSON string', () => {
    expect(detectFormat('"{\\"a\\":1}"')).toBe('escaped-json')
  })

  it('recognizes plain JSON', () => {
    expect(detectFormat('{"a":1}')).toBe('json5')
    expect(detectFormat('[1,2,3]')).toBe('json5')
  })

  it('recognizes XML', () => {
    expect(detectFormat('<root><a>1</a></root>')).toBe('xml')
  })

  it('recognizes NDJSON', () => {
    expect(detectFormat('{"a":1}\n{"a":2}\n{"a":3}')).toBe('ndjson')
  })

  it('recognizes JSON embedded in a log line', () => {
    expect(detectFormat('2026-01-01 INFO body: {"a":1} done')).toBe('log-json')
  })

  it('recognizes CSV', () => {
    expect(detectFormat('name,age\nAlice,30\nBob,25')).toBe('csv')
  })

  it('recognizes indented key: value as YAML', () => {
    expect(detectFormat('user:\n  name: John\n  age: 30')).toBe('yaml')
  })

  it('recognizes flat key: value lines as key-value', () => {
    expect(detectFormat('name: John\nage: 30')).toBe('key-value')
  })

  it('recognizes a query string', () => {
    expect(detectFormat('a=1&b=2&c=3')).toBe('query-string')
  })

  it('falls back to json5 for empty input', () => {
    expect(detectFormat('')).toBe('json5')
  })
})
