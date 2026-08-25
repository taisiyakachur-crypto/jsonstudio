import { decodeBase64ToString } from './base64'
import type { SourceFormat } from './types'

const JWT_RE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/
const BASE64_RE = /^[A-Za-z0-9+/_-]+={0,2}$/

/**
 * Best-effort guess at the input format, checked in order from most to least specific. The
 * manual switcher in the UI is the real safety net -- this only has to be right often enough
 * to save a click, not perfectly.
 */
export function detectFormat(rawText: string): Exclude<SourceFormat, 'auto'> {
  const text = rawText.trim()

  if (text === '') return 'json5'

  if (JWT_RE.test(text) && text.split('.').length === 3) return 'jwt'

  if (text.startsWith('"') && text.endsWith('"') && text.includes('\\"')) {
    return 'escaped-json'
  }

  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')

  // Multiple lines that are each individually a whole JSON value: NDJSON. Checked before the
  // single-blob check below, since the *whole* NDJSON text also starts with `{`/`[` and ends
  // with `}`/`]` and would otherwise be mistaken for one big JSON value.
  if (lines.length > 1 && lines.every((l) => /^[{[]/.test(l.trim()) && /[}\]]$/.test(l.trim()))) {
    return 'ndjson'
  }

  if (/^[{[]/.test(text) && /[}\]]$/.test(text)) {
    return 'json5'
  }

  if (text.startsWith('<')) return 'xml'

  const compact = text.replace(/\s+/g, '')
  if (BASE64_RE.test(compact) && compact.length > 12) {
    try {
      const decoded = decodeBase64ToString(compact).trim()
      if (/^[{[]/.test(decoded)) return 'base64'
    } catch {
      // fall through to other checks
    }
  }

  // A single line with `key=value` pairs (optionally joined by `&`) reads as a query string;
  // multi-line `key: value`/`key=value` blocks are handled further down as key-value/YAML.
  if (lines.length <= 1 && text.includes('=') && !text.startsWith('{') && !text.startsWith('[')) {
    return 'query-string'
  }

  if (/[{[]/.test(text)) return 'log-json'

  const firstLine = lines[0] ?? ''
  const looksTabular = firstLine.includes(',') || firstLine.includes('\t')
  const looksKeyed = lines.some((l) => /^[^\s:=][^:=]*[:=]/.test(l))
  const hasIndentedOrListLines = lines.some((l) => /^\s+\S/.test(l) || /^\s*-\s/.test(l))

  if (looksTabular && !looksKeyed) return 'csv'
  if (hasIndentedOrListLines && looksKeyed) return 'yaml'
  if (looksKeyed) return 'key-value'

  return 'json5'
}
