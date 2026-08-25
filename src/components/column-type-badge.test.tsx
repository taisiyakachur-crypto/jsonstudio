import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ColumnTypeBadge } from './column-type-badge'
import type { ColumnType } from '@/lib/flatten'

const ALL_TYPES: ColumnType[] = ['string', 'number', 'boolean', 'date', 'object', 'null', 'mixed']

describe('ColumnTypeBadge', () => {
  it.each(ALL_TYPES)('renders the "%s" type with a non-empty color class', (type) => {
    render(<ColumnTypeBadge type={type} />)
    const badge = screen.getByText(type)
    // Guards against a ColumnType variant silently missing from the color map (would
    // otherwise render an `undefined` class and fall back to no color at all).
    expect(badge.className).not.toMatch(/undefined/)
    expect(badge.className.length).toBeGreaterThan(0)
  })

  it('merges an extra className with its own', () => {
    render(<ColumnTypeBadge type="string" className="ml-2" />)
    expect(screen.getByText('string').className).toContain('ml-2')
  })
})
