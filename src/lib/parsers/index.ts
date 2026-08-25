import { parseBase64Json } from './base64'
import { parseCsv } from './csv'
import { detectFormat } from './detect'
import { parseEscapedJsonString } from './escaped-json'
import { parseJwt } from './jwt'
import { parseKeyValueLines } from './key-value'
import { parseJsonFromLogLine } from './log-json'
import { parseNdjson } from './ndjson'
import { parseQueryString } from './query-string'
import { parseSoftJson } from './soft-json'
import type { SourceFormat } from './types'
import { parseXml } from './xml'
import { parseYaml } from './yaml'
import type { JsonValue } from '@/types/json'

export type { SourceFormat } from './types'
export { detectFormat } from './detect'
export { escapeJsonToString } from './escape-json'
export { ParseInputError } from './errors'

export interface ParseOptions {
  csvDelimiter: string
}

export const DEFAULT_PARSE_OPTIONS: ParseOptions = { csvDelimiter: ',' }

export const SOURCE_FORMATS: Exclude<SourceFormat, 'auto'>[] = [
  'escaped-json',
  'log-json',
  'json5',
  'query-string',
  'key-value',
  'csv',
  'xml',
  'yaml',
  'ndjson',
  'base64',
  'jwt',
]

/** Parses `text` per `format` (resolving `'auto'` via `detectFormat` first). Throws
 *  `ParseInputError` with a message meant to be shown to the user directly. */
export function parseByFormat(
  text: string,
  format: SourceFormat,
  options: ParseOptions = DEFAULT_PARSE_OPTIONS,
): JsonValue {
  const resolved = format === 'auto' ? detectFormat(text) : format
  switch (resolved) {
    case 'escaped-json':
      return parseEscapedJsonString(text)
    case 'log-json':
      return parseJsonFromLogLine(text)
    case 'json5':
      return parseSoftJson(text)
    case 'query-string':
      return parseQueryString(text)
    case 'key-value':
      return parseKeyValueLines(text)
    case 'csv':
      return parseCsv(text, options.csvDelimiter || ',')
    case 'xml':
      return parseXml(text)
    case 'yaml':
      return parseYaml(text)
    case 'ndjson':
      return parseNdjson(text)
    case 'base64':
      return parseBase64Json(text)
    case 'jwt':
      return parseJwt(text)
  }
}
