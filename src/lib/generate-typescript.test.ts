import { describe, expect, it } from 'vitest'
import { generateTypeScript } from './generate-typescript'

describe('generateTypeScript', () => {
  it('generates a flat interface', () => {
    const out = generateTypeScript({ id: 1, name: 'a', active: true })
    expect(out).toBe('interface Root {\n  id: number\n  name: string\n  active: boolean\n}')
  })

  it('generates a nested interface for a nested object', () => {
    const out = generateTypeScript({ user: { name: 'a' } })
    expect(out).toContain('interface Root {\n  user: User\n}')
    expect(out).toContain('interface User {\n  name: string\n}')
  })

  it('renders an array of primitives inline', () => {
    const out = generateTypeScript({ tags: ['a', 'b'] })
    expect(out).toBe('interface Root {\n  tags: string[]\n}')
  })

  it('merges an array of same-shaped objects into one element interface', () => {
    const out = generateTypeScript({ items: [{ id: 1 }, { id: 2 }] })
    expect(out).toContain('interface Root {\n  items: Item[]\n}')
    expect(out).toContain('interface Item {\n  id: number\n}')
  })

  it('marks fields optional when missing from some array elements', () => {
    const out = generateTypeScript({ items: [{ id: 1, note: 'x' }, { id: 2 }] })
    expect(out).toContain('note?: string')
    expect(out).toContain('id: number')
  })

  it('emits a type alias with no name collision when the root is a scalar', () => {
    expect(generateTypeScript('hello')).toBe('export type Root = string;')
  })

  it('emits a type alias for a root array of primitives', () => {
    expect(generateTypeScript([1, 2, 3])).toBe('export type Root = number[];')
  })

  it('quotes property keys that are not valid identifiers', () => {
    const out = generateTypeScript({ 'not-valid': 1 })
    expect(out).toContain('"not-valid": number')
  })

  it('unions differing field types across array elements without duplicates', () => {
    const out = generateTypeScript({ items: [{ v: 1 }, { v: 'x' }, { v: 2 }] })
    expect(out).toContain('v: number | string')
  })

  it('disambiguates interfaces with the same suggested name but different shapes', () => {
    const out = generateTypeScript({ a: { x: 1 }, b: { a: { y: 'z' } } })
    // both the top-level "a" and the nested "a" inside "b" want the name "A"
    expect(out).toContain('interface A {\n  x: number\n}')
    expect(out).toContain('interface A2 {\n  y: string\n}')
  })
})
