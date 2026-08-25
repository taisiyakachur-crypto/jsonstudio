import type { JsonValue } from '@/types/json'

export type IndentOption = '2' | '4' | 'tab'

function indentString(indent: IndentOption): string | number {
  return indent === 'tab' ? '\t' : Number(indent)
}

export function formatJson(value: JsonValue | undefined, indent: IndentOption = '2'): string {
  if (value === undefined) return ''
  return JSON.stringify(value, null, indentString(indent))
}

export function minifyJson(value: JsonValue | undefined): string {
  if (value === undefined) return ''
  return JSON.stringify(value)
}
