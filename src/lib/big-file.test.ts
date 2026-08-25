import { describe, expect, it } from 'vitest'
import { extractPreview, formatBytes, PREVIEW_LINE_COUNT } from './big-file'

describe('formatBytes', () => {
  it('formats small sizes as bytes', () => {
    expect(formatBytes(500, 'en')).toBe('500 B')
  })

  it('formats megabytes with a localized unit', () => {
    expect(formatBytes(34 * 1024 * 1024, 'uk')).toBe('34.0 МБ')
    expect(formatBytes(34 * 1024 * 1024, 'en')).toBe('34.0 MB')
  })

  it('uses two decimals under 10 units', () => {
    expect(formatBytes(2.5 * 1024 * 1024, 'en')).toBe('2.50 MB')
  })

  it('treats zero and negative sizes as zero', () => {
    expect(formatBytes(0, 'en')).toBe('0 B')
    expect(formatBytes(-5, 'en')).toBe('0 B')
  })
})

describe('extractPreview', () => {
  it('returns short text untruncated', () => {
    const { previewText, truncated } = extractPreview('{\n  "a": 1\n}')
    expect(previewText).toBe('{\n  "a": 1\n}')
    expect(truncated).toBe(false)
  })

  it('caps at PREVIEW_LINE_COUNT lines', () => {
    const text = Array.from({ length: PREVIEW_LINE_COUNT + 50 }, (_, i) => `line ${i}`).join('\n')
    const { previewText, truncated } = extractPreview(text)
    expect(previewText.split('\n')).toHaveLength(PREVIEW_LINE_COUNT)
    expect(truncated).toBe(true)
  })

  it('caps extremely long single-line (minified) text by character count', () => {
    const text = 'x'.repeat(500_000)
    const { previewText, truncated } = extractPreview(text)
    expect(previewText.length).toBeLessThan(text.length)
    expect(truncated).toBe(true)
  })
})
