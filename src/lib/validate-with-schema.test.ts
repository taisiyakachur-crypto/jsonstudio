import { describe, expect, it } from 'vitest'
import { validateAgainstSchema } from './validate-with-schema'

const objectSchema = JSON.stringify({
  type: 'object',
  properties: { id: { type: 'number' }, name: { type: 'string' } },
  required: ['id', 'name'],
})

describe('validateAgainstSchema', () => {
  it('reports schema-error for invalid schema JSON', () => {
    const result = validateAgainstSchema({}, '{ not valid json')
    expect(result.status).toBe('schema-error')
  })

  it('reports schema-error for a structurally invalid schema', () => {
    const result = validateAgainstSchema({}, JSON.stringify({ type: 'not-a-real-type' }))
    expect(result.status).toBe('schema-error')
  })

  it('reports valid for a document that matches the schema', () => {
    const result = validateAgainstSchema({ id: 1, name: 'a' }, objectSchema)
    expect(result).toEqual({ status: 'valid' })
  })

  it('reports invalid with error messages for a document that violates the schema', () => {
    const result = validateAgainstSchema({ id: 'not a number' }, objectSchema)
    expect(result.status).toBe('invalid')
    if (result.status !== 'invalid') throw new Error('unreachable')
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors.some((e) => e.includes('id'))).toBe(true)
  })
})
