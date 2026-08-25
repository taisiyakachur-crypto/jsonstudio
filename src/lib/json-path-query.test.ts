import { describe, expect, it } from 'vitest'
import { queryJsonPath } from './json-path-query'

const doc = {
  store: {
    book: [
      { title: 'A', price: 10 },
      { title: 'B', price: 20 },
    ],
  },
}

describe('queryJsonPath', () => {
  it('returns an empty result for an empty expression', () => {
    expect(queryJsonPath(doc, '')).toEqual({ status: 'ok', results: [] })
  })

  it('resolves a simple path', () => {
    const result = queryJsonPath(doc, '$.store.book[0].title')
    expect(result).toEqual({ status: 'ok', results: ['A'] })
  })

  it('resolves a wildcard path across array elements', () => {
    const result = queryJsonPath(doc, '$.store.book[*].title')
    expect(result).toEqual({ status: 'ok', results: ['A', 'B'] })
  })

  it('resolves a filter expression', () => {
    const result = queryJsonPath(doc, '$.store.book[?(@.price > 15)].title')
    expect(result).toEqual({ status: 'ok', results: ['B'] })
  })

  it('returns an empty ok result for a path matching nothing', () => {
    const result = queryJsonPath(doc, '$.store.nonexistent')
    expect(result).toEqual({ status: 'ok', results: [] })
  })

  it('reports an error for a malformed expression', () => {
    const result = queryJsonPath(doc, '((((')
    expect(result.status).toBe('error')
  })
})
