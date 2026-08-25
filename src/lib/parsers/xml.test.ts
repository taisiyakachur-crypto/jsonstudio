import { describe, expect, it } from 'vitest'
import { parseXml } from './xml'

describe('parseXml', () => {
  it('turns a leaf element into a plain string keyed by the root tag', () => {
    expect(parseXml('<name>John</name>')).toEqual({ name: 'John' })
  })

  it('turns attributes into @-prefixed keys', () => {
    expect(parseXml('<user id="42">John</user>')).toEqual({
      user: { '@id': '42', '#text': 'John' },
    })
  })

  it('nests child elements', () => {
    expect(parseXml('<user><name>John</name><age>30</age></user>')).toEqual({
      user: { name: 'John', age: '30' },
    })
  })

  it('collects repeated child tags into an array', () => {
    expect(parseXml('<items><item>a</item><item>b</item></items>')).toEqual({
      items: { item: ['a', 'b'] },
    })
  })

  it('throws for malformed XML', () => {
    expect(() => parseXml('<a><b></a>')).toThrow()
  })
})
