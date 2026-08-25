import JSON5 from 'json5'
import { parse as jsoncParse, type ParseError, printParseErrorCode } from 'jsonc-parser'
import type { Locale } from '@/store/settings-store'
import type { JsonValue } from '@/types/json'
import { lineColumnToOffset, offsetToLineColumn } from './text-position'

export interface JsonValidationError {
  message: string
  line: number
  column: number
  offset: number
  length: number
}

export interface JsonValidationResult {
  valid: boolean
  value?: JsonValue
  error?: JsonValidationError
}

const PARSE_ERROR_MESSAGES: Record<
  ReturnType<typeof printParseErrorCode>,
  Record<Locale, string>
> = {
  InvalidSymbol: { uk: 'неочікуваний символ', en: 'unexpected symbol' },
  InvalidNumberFormat: { uk: 'неправильний формат числа', en: 'invalid number format' },
  PropertyNameExpected: {
    uk: 'очікувалась назва властивості в лапках',
    en: 'expected a quoted property name',
  },
  ValueExpected: { uk: 'очікувалось значення', en: 'expected a value' },
  ColonExpected: {
    uk: 'очікувалась двокрапка після назви властивості',
    en: 'expected a colon after the property name',
  },
  CommaExpected: { uk: 'очікувалась кома між властивостями', en: 'expected a comma' },
  CloseBraceExpected: { uk: 'очікувалась закриваюча дужка "}"', en: 'expected a closing "}"' },
  CloseBracketExpected: { uk: 'очікувалась закриваюча дужка "]"', en: 'expected a closing "]"' },
  EndOfFileExpected: {
    uk: 'зайві символи після завершення документа',
    en: 'unexpected content after the end of the document',
  },
  InvalidCommentToken: {
    uk: 'коментарі недопустимі у строгому режимі JSON',
    en: 'comments are not allowed in strict JSON',
  },
  UnexpectedEndOfComment: { uk: 'незавершений коментар', en: 'unterminated comment' },
  UnexpectedEndOfString: { uk: 'незавершений рядок', en: 'unterminated string' },
  UnexpectedEndOfNumber: { uk: 'неповне число', en: 'incomplete number' },
  InvalidUnicode: { uk: 'некоректна unicode-послідовність', en: 'invalid unicode escape' },
  InvalidEscapeCharacter: {
    uk: 'некоректний символ екранування',
    en: 'invalid escape character',
  },
  InvalidCharacter: { uk: 'неприпустимий символ', en: 'invalid character' },
  '<unknown ParseErrorCode>': { uk: 'помилка розбору JSON', en: 'JSON parse error' },
}

function formatLocation(line: number, column: number, locale: Locale): string {
  return locale === 'uk' ? `Рядок ${line}, колонка ${column}` : `Line ${line}, column ${column}`
}

function validateStrict(text: string, locale: Locale): JsonValidationResult {
  const errors: ParseError[] = []
  const value = jsoncParse(text, errors, { disallowComments: true, allowTrailingComma: false }) as
    | JsonValue
    | undefined
  const firstError = errors[0]
  if (!firstError) {
    return { valid: true, value }
  }
  const { line, column } = offsetToLineColumn(text, firstError.offset)
  const codeName = printParseErrorCode(firstError.error)
  const description = PARSE_ERROR_MESSAGES[codeName][locale]
  return {
    valid: false,
    error: {
      message: `${formatLocation(line, column, locale)}: ${description}`,
      line,
      column,
      offset: firstError.offset,
      length: Math.max(1, firstError.length),
    },
  }
}

function validateSoft(text: string, locale: Locale): JsonValidationResult {
  try {
    const value = JSON5.parse(text) as JsonValue
    return { valid: true, value }
  } catch (err) {
    const e = err as { message?: string; lineNumber?: number; columnNumber?: number }
    const line = e.lineNumber ?? 1
    const column = e.columnNumber ?? 1
    const offset = lineColumnToOffset(text, line, column)
    const prefix = locale === 'uk' ? 'Помилка JSON5' : 'JSON5 error'
    return {
      valid: false,
      error: {
        message: `${formatLocation(line, column, locale)}: ${prefix} — ${e.message ?? ''}`,
        line,
        column,
        offset,
        length: 1,
      },
    }
  }
}

export function validateJson(text: string, softMode: boolean, locale: Locale): JsonValidationResult {
  if (text.trim() === '') return { valid: true, value: undefined }
  return softMode ? validateSoft(text, locale) : validateStrict(text, locale)
}
