import { ParseInputError } from './errors'
import type { JsonValue } from '@/types/json'

const BASE64_RE = /^[A-Za-z0-9+/_-]+={0,2}$/

/** Decodes a base64 (or base64url) string as UTF-8 text. */
export function decodeBase64ToString(text: string): string {
  const cleaned = text.trim().replace(/\s+/g, '')
  if (cleaned === '' || !BASE64_RE.test(cleaned)) {
    throw new ParseInputError('Це не схоже на base64 (недопустимі символи).')
  }
  const normalized = cleaned.replace(/-/g, '+').replace(/_/g, '/')
  let binary: string
  try {
    binary = atob(normalized)
  } catch {
    throw new ParseInputError('Не вдалося декодувати base64.')
  }
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
}

/** Decodes a base64 string and parses the result as JSON. */
export function parseBase64Json(text: string): JsonValue {
  const decoded = decodeBase64ToString(text)
  try {
    return JSON.parse(decoded) as JsonValue
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new ParseInputError(`Розкодований вміст не є дійсним JSON: ${message}`)
  }
}
