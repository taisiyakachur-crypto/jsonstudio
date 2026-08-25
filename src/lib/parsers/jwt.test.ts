import { describe, expect, it } from 'vitest'
import { parseJwt } from './jwt'

function toBase64Url(obj: unknown): string {
  return btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

describe('parseJwt', () => {
  it('decodes header and payload without touching the signature', () => {
    const header = { alg: 'HS256', typ: 'JWT' }
    const payload = { sub: '1234', name: 'John' }
    const token = `${toBase64Url(header)}.${toBase64Url(payload)}.fakesignature`
    expect(parseJwt(token)).toEqual({ header, payload, signature: 'fakesignature' })
  })

  it('throws when the token does not have exactly 3 parts', () => {
    expect(() => parseJwt('only.two')).toThrow()
    expect(() => parseJwt('a.b.c.d')).toThrow()
  })

  it('throws when a segment is not valid base64', () => {
    expect(() => parseJwt('not base64!.also bad.sig')).toThrow()
  })
})
