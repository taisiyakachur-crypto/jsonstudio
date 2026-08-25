import { decodeBase64ToString } from './base64'
import { ParseInputError } from './errors'
import type { JsonValue } from '@/types/json'

/** Splits a JWT into its three segments and decodes the header/payload as JSON. The signature
 *  is never verified -- it's returned as its raw base64url text, which is all a browser-only
 *  tool without the signing key could meaningfully show anyway. */
export function parseJwt(text: string): JsonValue {
  const trimmed = text.trim()
  const parts = trimmed.split('.')
  if (parts.length !== 3) {
    throw new ParseInputError('JWT має складатися з трьох частин, розділених крапками.')
  }
  const [headerPart, payloadPart, signature] = parts

  function decodePart(part: string, label: string): JsonValue {
    let decoded: string
    try {
      decoded = decodeBase64ToString(part)
    } catch {
      throw new ParseInputError(`Не вдалося декодувати ${label}.`)
    }
    try {
      return JSON.parse(decoded) as JsonValue
    } catch {
      throw new ParseInputError(`${label} не є дійсним JSON після декодування.`)
    }
  }

  return {
    header: decodePart(headerPart!, 'header'),
    payload: decodePart(payloadPart!, 'payload'),
    signature,
  }
}
