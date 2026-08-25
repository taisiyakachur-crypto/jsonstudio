import { describe, expect, it } from 'vitest'
import { parseYaml } from './yaml'

describe('parseYaml', () => {
  it('parses flat key-value mappings', () => {
    expect(parseYaml('name: John\nage: 30')).toEqual({ name: 'John', age: 30 })
  })

  it('parses nested mappings and lists', () => {
    expect(parseYaml('user:\n  name: John\n  tags:\n    - vip\n    - beta')).toEqual({
      user: { name: 'John', tags: ['vip', 'beta'] },
    })
  })

  it('throws for invalid YAML', () => {
    expect(() => parseYaml('a: [1, 2\n b: 3')).toThrow()
  })

  it('throws for an empty document', () => {
    expect(() => parseYaml('')).toThrow()
  })
})
