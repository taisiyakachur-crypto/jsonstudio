import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { JsonValueView } from './json-value-view'

describe('JsonValueView', () => {
  it('renders a string scalar with quotes', () => {
    render(<JsonValueView value="hello" />)
    expect(screen.getByText('"hello"')).toBeInTheDocument()
  })

  it('renders a number scalar without quotes', () => {
    render(<JsonValueView value={42} />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders null and boolean scalars', () => {
    const { rerender } = render(<JsonValueView value={null} />)
    expect(screen.getByText('null')).toBeInTheDocument()
    rerender(<JsonValueView value={false} />)
    expect(screen.getByText('false')).toBeInTheDocument()
  })

  it('renders an object expanded by default at depth 0, showing its keys and values', () => {
    render(<JsonValueView value={{ a: 1, b: 'x' }} />)
    expect(screen.getByText('{2}')).toBeInTheDocument()
    expect(screen.getByText('a:')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('b:')).toBeInTheDocument()
    expect(screen.getByText('"x"')).toBeInTheDocument()
  })

  it('renders an array with its length and index keys', () => {
    render(<JsonValueView value={['a', 'b', 'c']} />)
    expect(screen.getByText('[3]')).toBeInTheDocument()
    expect(screen.getByText('0:')).toBeInTheDocument()
    expect(screen.getByText('2:')).toBeInTheDocument()
  })

  it('collapses and re-expands children on click', async () => {
    const user = userEvent.setup()
    render(<JsonValueView value={{ a: 1 }} />)
    expect(screen.getByText('a:')).toBeInTheDocument()

    await user.click(screen.getByRole('button'))
    expect(screen.queryByText('a:')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button'))
    expect(screen.getByText('a:')).toBeInTheDocument()
  })

  it('starts collapsed for nested objects at depth 2 or deeper', () => {
    render(<JsonValueView value={{ a: { b: { c: 1 } } }} />)
    // depth 0 ("a") and depth 1 ("b") are expanded by default; depth 2 ("c") is not.
    expect(screen.getByText('b:')).toBeInTheDocument()
    expect(screen.queryByText('c:')).not.toBeInTheDocument()
  })
})
