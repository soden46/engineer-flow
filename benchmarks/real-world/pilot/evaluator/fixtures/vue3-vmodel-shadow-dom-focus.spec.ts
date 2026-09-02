import { describe, it, expect } from 'vitest'
import { ref, nextTick } from '@vue/runtime-dom'

describe('vModel', () => {
  it('should preserve unresolved trimmed text while focused in nested shadow roots', async () => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    const shadow1 = root.attachShadow({ mode: 'open' })
    const inner = document.createElement('div')
    shadow1.appendChild(inner)
    const shadow2 = inner.attachShadow({ mode: 'open' })
    const input = document.createElement('input')
    shadow2.appendChild(input)
    const model = ref('')
    const trimRef = ref('')
    const Comp = {
      template: '<input v-model.trim="trimRef" />',
      setup() {
        return { trimRef }
      },
    }
    const vm = createApp(Comp).mount(root)
    input.focus()
    input.value = '  hello  '
    input.dispatchEvent(new Event('input'))
    expect(input.value).toBe('  hello  ')
    expect(trimRef.value).toBe('hello')
    document.body.removeChild(root)
  })
})
