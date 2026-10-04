import { vi } from 'vitest'

export const restoreTestTimers = () => {
  if (!vi.isFakeTimers()) return
  vi.clearAllTimers()
  vi.useRealTimers()
}
