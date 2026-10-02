import type { QuerySession } from '@/lib/query/create-query-session'
import { NOTIFICATION_CONFIG } from './constants'

const { CHAT_REFRESH_MS } = NOTIFICATION_CONFIG

export const createNotificationChatRefresh = (session: QuerySession) => {
  let timer: ReturnType<typeof setTimeout> | undefined
  let running = false
  let dirty = false
  let closed = false
  let lastStarted = 0
  const run = async () => {
    const unavailable = closed || !session.isActive()
    if (unavailable) return
    if (running) return
    dirty = false
    running = true
    lastStarted = Date.now()
    try {
      await session.client.fetchQuery({ ...session.options(), staleTime: 0 })
    } catch {
      /* Query owns the error; retained facts are untouched. */
    } finally {
      running = false
      if (dirty) schedule()
    }
  }
  const schedule = () => {
    const alreadyScheduled = closed || running || timer !== undefined
    if (alreadyScheduled) return
    timer = setTimeout(
      () => {
        timer = undefined
        void run()
      },
      Math.max(0, CHAT_REFRESH_MS - (Date.now() - lastStarted)),
    )
  }
  return {
    request: () => {
      dirty = true
      schedule()
    },
    close: () => {
      closed = true
      clearTimeout(timer)
    },
  }
}
