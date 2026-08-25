import { describe, expect, it } from 'vitest'
import { inferType, mergeTypes, type InferredType } from './infer-json-type'

describe('inferType', () => {
  it('infers primitives', () => {
    expect(inferType('a')).toEqual({ kind: 'string' })
    expect(inferType(1)).toEqual({ kind: 'number' })
    expect(inferType(true)).toEqual({ kind: 'boolean' })
    expect(inferType(null)).toEqual({ kind: 'null' })
  })

  it('infers an object with all fields required', () => {
    const t = inferType({ a: 1, b: 'x' })
    expect(t.kind).toBe('object')
    if (t.kind !== 'object') throw new Error('unreachable')
    expect(t.fields.get('a')).toEqual({ type: { kind: 'number' }, optional: false })
    expect(t.fields.get('b')).toEqual({ type: { kind: 'string' }, optional: false })
  })

  it('infers an empty array as array of unknown', () => {
    expect(inferType([])).toEqual({ kind: 'array', of: { kind: 'unknown' } })
  })

  it('merges uniform array elements without optionality', () => {
    const t = inferType([{ a: 1 }, { a: 2 }])
    expect(t.kind).toBe('array')
    if (t.kind !== 'array' || t.of.kind !== 'object') throw new Error('unreachable')
    expect(t.of.fields.get('a')).toEqual({ type: { kind: 'number' }, optional: false })
  })

  it('marks fields missing from some array elements as optional', () => {
    const t = inferType([{ a: 1, b: 'x' }, { a: 2 }])
    if (t.kind !== 'array' || t.of.kind !== 'object') throw new Error('unreachable')
    expect(t.of.fields.get('a')).toEqual({ type: { kind: 'number' }, optional: false })
    expect(t.of.fields.get('b')).toEqual({ type: { kind: 'string' }, optional: true })
  })

  it('unions differing types for the same field across elements', () => {
    const t = inferType([{ a: 1 }, { a: 'x' }])
    if (t.kind !== 'array' || t.of.kind !== 'object') throw new Error('unreachable')
    const fieldType = t.of.fields.get('a')?.type
    expect(fieldType).toEqual({ kind: 'union', options: [{ kind: 'number' }, { kind: 'string' }] })
  })

  it('merges nested object shapes across array elements', () => {
    const t = inferType([{ nested: { x: 1 } }, { nested: { y: 'a' } }])
    if (t.kind !== 'array' || t.of.kind !== 'object') throw new Error('unreachable')
    const nested = t.of.fields.get('nested')?.type
    if (!nested || nested.kind !== 'object') throw new Error('unreachable')
    expect(nested.fields.get('x')).toEqual({ type: { kind: 'number' }, optional: true })
    expect(nested.fields.get('y')).toEqual({ type: { kind: 'string' }, optional: true })
  })
})

describe('mergeTypes', () => {
  it('treats unknown as absorbing (identity element)', () => {
    expect(mergeTypes({ kind: 'unknown' }, { kind: 'string' })).toEqual({ kind: 'string' })
    expect(mergeTypes({ kind: 'number' }, { kind: 'unknown' })).toEqual({ kind: 'number' })
  })

  it('does not duplicate identical primitive kinds in a union', () => {
    const t = mergeTypes({ kind: 'string' }, { kind: 'string' })
    expect(t).toEqual({ kind: 'string' })
  })

  it('collapses a union merged with another union into one flat union', () => {
    const u1: InferredType = { kind: 'union', options: [{ kind: 'string' }, { kind: 'number' }] }
    const t = mergeTypes(u1, { kind: 'boolean' })
    expect(t).toEqual({ kind: 'union', options: [{ kind: 'string' }, { kind: 'number' }, { kind: 'boolean' }] })
  })
})
