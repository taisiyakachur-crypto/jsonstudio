import type { JsonPathSegment } from '@/types/json-doc'

const VALID_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/

/** Renders a path as a `$.user.orders[0].id`-style JSONPath string. */
export function formatJsonPath(path: JsonPathSegment[]): string {
  let out = '$'
  for (const segment of path) {
    if (typeof segment === 'number') {
      out += `[${segment}]`
    } else if (VALID_IDENTIFIER.test(segment)) {
      out += `.${segment}`
    } else {
      out += `[${JSON.stringify(segment)}]`
    }
  }
  return out
}
