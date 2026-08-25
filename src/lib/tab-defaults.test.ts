import { describe, expect, it } from 'vitest'
import { defaultStateFor } from './tab-defaults'

describe('defaultStateFor', () => {
  it('gives compare tabs two empty panels', () => {
    const state = defaultStateFor('compare')
    expect(state.panels).toHaveLength(2)
    expect(state.panels.every((p) => p.text === '')).toBe(true)
  })

  it('gives format tabs a 2-space default indent', () => {
    expect(defaultStateFor('format').indent).toBe('2')
  })

  it('gives table tabs a root path of $', () => {
    expect(defaultStateFor('table').rootPath).toBe('$')
  })
})
