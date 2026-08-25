import { ParseInputError } from './errors'
import { isJsonArray, isJsonObject, type JsonObject, type JsonValue } from '@/types/json'

/** Splits `b[]`, `user[name]`, `a` into `['b', '']`, `['user', 'name']`, `['a']`. */
function splitBracketPath(rawKey: string): string[] {
  const match = /^([^[\]]+)((?:\[[^[\]]*\])*)$/.exec(rawKey)
  if (!match) return [rawKey]
  const [, head, brackets] = match
  const segments = [head!]
  const bracketRe = /\[([^[\]]*)\]/g
  let m: RegExpExecArray | null
  while ((m = bracketRe.exec(brackets!))) segments.push(m[1]!)
  return segments
}

/** Walks/creates containers along `segments`, writing `value` at the end. An empty segment
 *  (from `key[]`) means "push onto the array here"; a numeric segment indexes into an array. */
function assign(root: JsonObject, segments: string[], value: string): void {
  let container: JsonValue = root

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!
    const isLast = i === segments.length - 1

    if (isLast) {
      if (seg === '' && isJsonArray(container)) container.push(value)
      else if (isJsonObject(container)) container[seg] = value
      else if (isJsonArray(container) && /^\d+$/.test(seg)) container[Number(seg)] = value
      return
    }

    const nextIsArray = segments[i + 1] === '' || /^\d+$/.test(segments[i + 1]!)

    if (seg === '' && isJsonArray(container)) {
      const child: JsonValue = nextIsArray ? [] : {}
      container.push(child)
      container = child
    } else if (/^\d+$/.test(seg) && isJsonArray(container)) {
      const existing: JsonValue | undefined = container[Number(seg)]
      const child: JsonValue = (nextIsArray ? isJsonArray(existing) : isJsonObject(existing))
        ? existing!
        : nextIsArray
          ? []
          : {}
      container[Number(seg)] = child
      container = child
    } else if (isJsonObject(container)) {
      const existing: JsonValue | undefined = container[seg]
      const child: JsonValue = (nextIsArray ? isJsonArray(existing) : isJsonObject(existing))
        ? existing!
        : nextIsArray
          ? []
          : {}
      container[seg] = child
      container = child
    } else {
      return // shape mismatch (e.g. mixing `a=1` with `a[]=2`) -- drop silently
    }
  }
}

/** Parses a URL query string (`a=1&b[]=2&b[]=3`, `user[name]=John`) into a plain object. */
export function parseQueryString(text: string): JsonValue {
  const trimmed = text.trim().replace(/^\?/, '')
  if (trimmed === '') {
    throw new ParseInputError('Порожній рядок запиту.')
  }
  if (!trimmed.includes('=') && !trimmed.includes('&')) {
    throw new ParseInputError('Це не схоже на query string (немає "=" чи "&").')
  }

  const result: JsonObject = {}
  for (const pair of trimmed.split('&')) {
    if (pair === '') continue
    const eqIndex = pair.indexOf('=')
    const rawKey = eqIndex === -1 ? pair : pair.slice(0, eqIndex)
    const rawValue = eqIndex === -1 ? '' : pair.slice(eqIndex + 1)
    let key: string
    let value: string
    try {
      key = decodeURIComponent(rawKey.replace(/\+/g, ' '))
      value = decodeURIComponent(rawValue.replace(/\+/g, ' '))
    } catch {
      throw new ParseInputError(`Не вдалося декодувати пару "${pair}".`)
    }
    assign(result, splitBracketPath(key), value)
  }
  return result
}
