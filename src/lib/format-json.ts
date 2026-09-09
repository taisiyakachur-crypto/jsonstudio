import type { JsonValue } from '@/types/json'

export type IndentOption = '2' | '4' | 'tab'

function indentString(indent: IndentOption): string | number {
  return indent === 'tab' ? '\t' : Number(indent)
}

/** The literal whitespace unit for `indent` (`'  '`, `'    '`, or a tab) -- e.g. for building the
 *  same indentation `JSON.stringify(value, null, indent)` would, by hand. */
export function indentUnit(indent: IndentOption): string {
  return indent === 'tab' ? '\t' : ' '.repeat(Number(indent))
}

export function formatJson(value: JsonValue | undefined, indent: IndentOption = '2'): string {
  if (value === undefined) return ''
  return JSON.stringify(value, null, indentString(indent))
}

export function minifyJson(value: JsonValue | undefined): string {
  if (value === undefined) return ''
  return JSON.stringify(value)
}
