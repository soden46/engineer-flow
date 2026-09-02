import { describe, it, expect } from 'vitest'
import { reactive, effect } from '../../packages/reactivity/src'

describe('reactive', () => {
  it('failed set operation should not trigger effects', () => {
    const obj = Object.defineProperty({}, 'prop', {
      value: 1,
      writable: false,
      configurable: false,
    })
    const proxy = reactive(obj)
    let effectCount = 0
    effect(() => {
      effectCount++
    })
    effectCount = 0
    expect(() => {
      proxy.prop = 2
    }).toThrow()
    expect(effectCount).toBe(0)
  })
})
