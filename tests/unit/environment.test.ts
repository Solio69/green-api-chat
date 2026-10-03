import { describe, expect, test, vi } from 'vitest'

const originalFetch = globalThis.fetch
const originalEnvironment = process.env.TEST_RUNTIME_ISOLATION
const operation = { read: () => 'original' }
const trackedCall = vi.fn()
let pendingTimerRan = false
const timerCallback = () => {
  pendingTimerRan = true
}

describe('Node test environment cleanup', { concurrent: false }, () => {
  test('runs without DOM and permits scoped mocks, globals and fake timers', () => {
    expect(typeof document).toBe('undefined')
    expect(typeof window).toBe('undefined')
    vi.spyOn(operation, 'read').mockReturnValue('changed')
    vi.stubGlobal('fetch', vi.fn())
    vi.stubEnv('TEST_RUNTIME_ISOLATION', 'changed')
    trackedCall('previous test')
    vi.useFakeTimers()
    setTimeout(timerCallback, 1000)

    expect(operation.read()).toBe('changed')
    expect(globalThis.fetch).not.toBe(originalFetch)
    expect(process.env.TEST_RUNTIME_ISOLATION).toBe('changed')
    expect(vi.getTimerCount()).toBe(1)
  })

  test('restores the next test without calls, spies, stubs or fake timers', () => {
    expect(operation.read()).toBe('original')
    expect(globalThis.fetch).toBe(originalFetch)
    expect(process.env.TEST_RUNTIME_ISOLATION).toBe(originalEnvironment)
    expect(trackedCall).not.toHaveBeenCalled()
    expect(pendingTimerRan).toBe(false)
    expect(vi.isFakeTimers()).toBe(false)
    expect(typeof document).toBe('undefined')
  })
})
