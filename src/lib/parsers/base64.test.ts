import { describe, expect, it } from 'vitest'
import { decodeBase64ToString, parseBase64Json } from './base64'

function utf8ToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}

describe('decodeBase64ToString', () => {
  it('decodes plain ASCII', () => {
    expect(decodeBase64ToString(btoa('hello'))).toBe('hello')
  })

  it('decodes multi-byte UTF-8 text correctly', () => {
    expect(decodeBase64ToString(utf8ToBase64('Іван — привіт'))).toBe('Іван — привіт')
  })

  it('decodes base64url variants (- and _)', () => {
    const standard = utf8ToBase64('a?/b')
    const urlSafe = standard.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    expect(decodeBase64ToString(urlSafe)).toBe('a?/b')
  })

  it('throws for text with invalid base64 characters', () => {
    expect(() => decodeBase64ToString('not base64 at all!')).toThrow()
  })
})

describe('parseBase64Json', () => {
  it('decodes and parses embedded JSON', () => {
    const encoded = btoa(JSON.stringify({ id: 1 }))
    expect(parseBase64Json(encoded)).toEqual({ id: 1 })
  })

  it('throws when the decoded content is not JSON', () => {
    expect(() => parseBase64Json(btoa('plain text'))).toThrow()
  })
})
