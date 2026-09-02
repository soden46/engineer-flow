test('failed set operation should not trigger effects', () => {
  const original: any = {}
  Object.defineProperty(original, 'foo', {
    value: 1,
    writable: false,
    configurable: true,
  })
  const observed = reactive(original)
  let dummy
  let run = 0
  effect(() => {
    run++
    dummy = observed.foo
  })

  expect(() => {
    observed.foo = 2
  }).toThrow(TypeError)
  expect(dummy).toBe(1)
  expect(run).toBe(1)
})
