it('should preserve unresolved trimmed text while focused in nested shadow roots', async () => {
  const model = ref('')
  const component = defineComponent({
    render() {
      return withVModel(
        h('input', {
          'onUpdate:modelValue': (value: string) => {
            model.value = value
          },
        }),
        model.value,
        {
          trim: true,
        },
      )
    },
  })

  document.body.appendChild(root)
  const outerShadowRoot = root.attachShadow({ mode: 'open' })
  const innerHost = document.createElement('div')
  outerShadowRoot.appendChild(innerHost)
  const innerShadowRoot = innerHost.attachShadow({ mode: 'open' })

  try {
    render(h(component), innerShadowRoot)

    const input = innerShadowRoot.querySelector('input') as HTMLInputElement
    input.focus()

    expect(document.activeElement).toBe(root)
    expect(outerShadowRoot.activeElement).toBe(innerHost)
    expect(innerShadowRoot.activeElement).toBe(input)

    input.value = '    hello, world    '
    triggerEvent('input', input)
    await nextTick()

    expect(model.value).toEqual('hello, world')
    expect(input.value).toEqual('    hello, world    ')
  } finally {
    render(null, innerShadowRoot)
    root.remove()
  }
})
