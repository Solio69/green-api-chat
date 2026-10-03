import { afterEach, expect, it, vi } from 'vitest'
import { createNotificationChatRefresh } from '@/lib/notifications/refresh-notification-chats'
import { createQuerySession } from '@/lib/query/create-query-session'

const scope = 'fictional-scope'

afterEach(() => {
  vi.useRealTimers()
})

it('coalesces rapid chat refresh requests and releases the scheduled timer on close', async () => {
  vi.useFakeTimers()
  let time = 1_000
  let reads = 0
  const session = createQuerySession({
    connectionScope: scope,
    fetcher: async () => {
      reads += 1
      return Response.json({ status: 'ok', connectionScope: scope, chats: [] })
    },
  })
  const refresh = createNotificationChatRefresh({ session, now: () => time })
  try {
    refresh.request()
    refresh.request()
    refresh.request()
    await vi.advanceTimersByTimeAsync(0)
    expect(reads).toBe(1)
    time = 1_100
    refresh.request()
    await vi.advanceTimersByTimeAsync(899)
    expect(reads).toBe(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(reads).toBe(2)
    time = 1_200
    refresh.request()
    refresh.close()
    await vi.runAllTimersAsync()
    expect(reads).toBe(2)
  } finally {
    refresh.close()
    await session.close()
  }
})
