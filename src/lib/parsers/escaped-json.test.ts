import { describe, expect, it } from 'vitest'
import { parseEscapedJsonString } from './escaped-json'

describe('parseEscapedJsonString', () => {
  it('unwraps a single layer of escaping', () => {
    expect(parseEscapedJsonString('"{\\"id\\":1,\\"name\\":\\"Іван\\"}"')).toEqual({
      id: 1,
      name: 'Іван',
    })
  })

  it('unwraps double escaping', () => {
    const once = JSON.stringify({ a: 1 })
    const twice = JSON.stringify(once)
    expect(parseEscapedJsonString(twice)).toEqual({ a: 1 })
  })

  it('unwraps triple escaping', () => {
    const value = { nested: { b: [1, 2] } }
    const thrice = JSON.stringify(JSON.stringify(JSON.stringify(value)))
    expect(parseEscapedJsonString(thrice)).toEqual(value)
  })

  it('stops unwrapping once the result is a plain string', () => {
    expect(parseEscapedJsonString(JSON.stringify('just a string'))).toBe('just a string')
  })

  it('throws for text that is not JSON at all', () => {
    expect(() => parseEscapedJsonString('not json')).toThrow()
  })
})
