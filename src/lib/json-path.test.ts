import { describe, expect, it } from 'vitest'
import { formatJsonPath } from './json-path'

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
