import { describe, expect, it } from 'vitest'
import { parseCsv, tokenizeDelimited } from './csv'

describe('tokenizeDelimited', () => {
  it('splits plain rows', () => {
    expect(tokenizeDelimited('a,b,c\n1,2,3', ',')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ])
  })

  it('keeps a delimiter inside quotes as part of the cell', () => {
    expect(tokenizeDelimited('a,"b,c",d', ',')).toEqual([['a', 'b,c', 'd']])
  })

  it('unescapes doubled quotes inside a quoted cell', () => {
    expect(tokenizeDelimited('"say ""hi"""', ',')).toEqual([['say "hi"']])
  })

  it('keeps a newline inside a quoted cell as part of the cell', () => {
    expect(tokenizeDelimited('"line1\nline2",b', ',')).toEqual([['line1\nline2', 'b']])
  })

  it('supports tab as the delimiter', () => {
    expect(tokenizeDelimited('a\tb\n1\t2', '\t')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })
})

describe('parseCsv', () => {
  it('uses the first row as object keys', () => {
    expect(parseCsv('name,age\nAlice,30\nBob,25')).toEqual([
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ])
  })

  it('strips a leading UTF-8 BOM before parsing headers', () => {
    expect(parseCsv('﻿name,age\nAlice,30')).toEqual([{ name: 'Alice', age: 30 }])
  })

  it('coerces numeric and boolean cells', () => {
    expect(parseCsv('n,active\n1.5,true')).toEqual([{ n: 1.5, active: true }])
  })

  it('parses TSV given a tab delimiter', () => {
    expect(parseCsv('a\tb\n1\t2', '\t')).toEqual([{ a: 1, b: 2 }])
  })

  it('throws for empty input', () => {
    expect(() => parseCsv('')).toThrow()
  })

  it('throws when there is no header row', () => {
    expect(() => parseCsv('\n\n')).toThrow()
  })
})
