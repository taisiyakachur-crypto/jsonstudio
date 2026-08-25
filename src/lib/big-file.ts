import type { Locale } from '@/store/settings-store'

/** Above this, CodeMirror is not used for editing (stage 3): read-only preview instead. */
export const EDITOR_SIZE_LIMIT_BYTES = 2 * 1024 * 1024 // 2 MB

/** Above this, files are read in chunks via `@streamparser/json` instead of `file.text()`. */
export const STREAMING_SIZE_LIMIT_BYTES = 20 * 1024 * 1024 // 20 MB

export const PREVIEW_LINE_COUNT = 2000
/** Hard cap on preview length in characters, in case lines are extremely long (minified JSON). */
export const PREVIEW_CHAR_CAP = 400_000

const UNITS_UK = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ']
const UNITS_EN = ['B', 'KB', 'MB', 'GB', 'TB']

export function formatBytes(bytes: number, locale: Locale = 'uk'): string {
  const units = locale === 'uk' ? UNITS_UK : UNITS_EN
  if (bytes <= 0) return `0 ${units[0]}`
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  const formatted = exponent === 0 ? String(value) : value.toFixed(value < 10 ? 2 : 1)
  return `${formatted} ${units[exponent]}`
}

/** Slices raw text down to the first ~2000 lines, capped by character count too. */
export function extractPreview(text: string): { previewText: string; truncated: boolean } {
  const capped = text.length > PREVIEW_CHAR_CAP
  const source = capped ? text.slice(0, PREVIEW_CHAR_CAP) : text
  const lines = source.split('\n')
  if (lines.length <= PREVIEW_LINE_COUNT) {
    return { previewText: source, truncated: capped }
  }
  return {
    previewText: lines.slice(0, PREVIEW_LINE_COUNT).join('\n'),
    truncated: true,
  }
}
