import { describe, expect, it } from 'vitest'
import { generateJsonSchema } from './generate-json-schema'

describe('generateJsonSchema', () => {
  it('includes the draft-07 $schema marker', () => {
    expect(generateJsonSchema({ a: 1 }).$schema).toBe('http://json-schema.org/draft-07/schema#')
  })

  it('generates an object schema with required properties', () => {
    const schema = generateJsonSchema({ id: 1, name: 'a' })
    expect(schema.type).toBe('object')
    expect(schema.properties).toEqual({ id: { type: 'number' }, name: { type: 'string' } })
    expect(schema.required).toEqual(['id', 'name'])
  })

  it('omits fields missing from some array elements out of required', () => {
    const schema = generateJsonSchema({ items: [{ id: 1, note: 'x' }, { id: 2 }] })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const itemSchema = (schema.properties as any).items.items
    expect(itemSchema.required).toEqual(['id'])
  })

  it('describes an array schema', () => {
    const schema = generateJsonSchema([1, 2, 3])
    expect(schema.type).toBe('array')
    expect(schema.items).toEqual({ type: 'number' })
  })

  it('uses a type array for a union of primitives', () => {
    const schema = generateJsonSchema({ items: [{ v: 1 }, { v: 'x' }] })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vSchema = (schema.properties as any).items.items.properties.v
    expect(vSchema.type).toEqual(['number', 'string'])
  })

  it('uses anyOf for a union involving an object', () => {
    const schema = generateJsonSchema({ items: [{ v: 1 }, { v: { nested: true } }] })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vSchema = (schema.properties as any).items.items.properties.v
    expect(vSchema.anyOf).toBeDefined()
    expect(vSchema.anyOf).toHaveLength(2)
  })

  it('describes an empty array as items: {}', () => {
    const schema = generateJsonSchema({ items: [] })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((schema.properties as any).items).toEqual({ type: 'array', items: {} })
  })
})
