import { ParseInputError } from './errors'
import type { JsonObject, JsonValue } from '@/types/json'

/** Splits CSV/TSV text into rows of raw string cells, honoring RFC 4180 quoting: quoted
 *  fields can contain the delimiter, newlines, and `""` as an escaped quote. */
export function tokenizeDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false
  let i = 0

  while (i < text.length) {
    const ch = text[i]!
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      cell += ch
      i++
      continue
    }

    if (ch === '"') {
      inQuotes = true
      i++
    } else if (ch === delimiter) {
      row.push(cell)
      cell = ''
      i++
    } else if (ch === '\r') {
      i++
    } else if (ch === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
      i++
    } else {
      cell += ch
      i++
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}

function coerceCell(raw: string): JsonValue {
  if (raw === '') return ''
  if (!Number.isNaN(Number(raw)) && raw.trim() !== '') return Number(raw)
  if (raw === 'true') return true
  if (raw === 'false') return false
  return raw
}

/** Parses CSV/TSV text (first row = headers) into an array of objects. */
export function parseCsv(text: string, delimiter = ','): JsonValue {
  const trimmed = text.replace(/^\uFEFF/, '')
  const rows = tokenizeDelimited(trimmed, delimiter).filter(
    (r) => !(r.length === 1 && r[0] === ''),
  )
  if (rows.length === 0) {
    throw new ParseInputError('Порожній CSV/TSV.')
  }
  const [header, ...dataRows] = rows
  if (!header || header.every((h) => h.trim() === '')) {
    throw new ParseInputError('Не вдалося знайти рядок заголовків.')
  }

  return dataRows.map((row) => {
    const obj: JsonObject = {}
    header.forEach((key, i) => {
      obj[key.trim() || `column_${i + 1}`] = coerceCell(row[i] ?? '')
    })
    return obj
  })
}
