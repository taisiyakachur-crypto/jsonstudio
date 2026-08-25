import { ParseInputError } from './errors'
import type { JsonObject, JsonPrimitive, JsonValue } from '@/types/json'

/** `"true"` -> `true`, `"42"` -> `42`, `"null"` -> `null`, otherwise the string as-is. */
function coerce(raw: string): JsonPrimitive {
  const value = raw.trim()
  if (value === 'true') return true
  if (value === 'false') return false
  if (value === 'null') return null
  if (value !== '' && !Number.isNaN(Number(value))) return Number(value)
  return value
}

/** Parses `key: value` / `key = value` lines (one per line, e.g. a `.env` or log-context
 *  block) into a flat object. Blank lines and `#`/`//`-prefixed lines are skipped. */
export function parseKeyValueLines(text: string): JsonValue {
  const lines = text.split(/\r?\n/)
  const result: JsonObject = {}
  let matchedAny = false

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (line === '' || line.startsWith('#') || line.startsWith('//')) continue

    const match = /^([^:=]+?)\s*[:=]\s*(.*)$/.exec(line)
    if (!match) continue
    const [, key, value] = match
    result[key!.trim()] = coerce(value!)
    matchedAny = true
  }

  if (!matchedAny) {
    throw new ParseInputError('Не знайдено жодного рядка у форматі "ключ: значення" чи "ключ=значення".')
  }
  return result
}
