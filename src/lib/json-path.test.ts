import { describe, expect, it } from 'vitest'
import { formatJsonPath, parseJsonPath } from './json-path'

describe('formatJsonPath', () => {
  it('renders the root path', () => {
    expect(formatJsonPath([])).toBe('$')
  })

  it('renders plain identifier keys with dot notation', () => {
    expect(formatJsonPath(['user', 'name'])).toBe('$.user.name')
  })

  it('renders array indices with brackets', () => {
    expect(formatJsonPath(['orders', 0, 'id'])).toBe('$.orders[0].id')
  })

  it('quotes keys that are not valid identifiers', () => {
    expect(formatJsonPath(['a-b', 'c d'])).toBe('$["a-b"]["c d"]')
  })
})

describe('parseJsonPath', () => {
  it('parses the root path', () => {
    expect(parseJsonPath('$')).toEqual([])
  })

  it('parses dotted identifier keys', () => {
    expect(parseJsonPath('$.user.name')).toEqual(['user', 'name'])
  })

  it('parses array indices', () => {
    expect(parseJsonPath('$.orders[0].id')).toEqual(['orders', 0, 'id'])
  })

  it('parses quoted keys', () => {
    expect(parseJsonPath('$["a-b"]["c d"]')).toEqual(['a-b', 'c d'])
  })

  it('round-trips through formatJsonPath', () => {
    const path = ['orders', 0, 'a-b', 'c d']
    expect(parseJsonPath(formatJsonPath(path))).toEqual(path)
  })

  it('returns null for input not starting with $', () => {
    expect(parseJsonPath('user.name')).toBeNull()
  })

  it('returns null for malformed brackets', () => {
    expect(parseJsonPath('$.orders[abc]')).toBeNull()
    expect(parseJsonPath('$.orders[0')).toBeNull()
    expect(parseJsonPath('$["unterminated')).toBeNull()
  })
})
