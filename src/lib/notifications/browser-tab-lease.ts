import { SessionQueryError } from '@/lib/query/session-query-error'
import { POLLING_CONFIG } from './constants'

const { LOCK_PREFIX, LOCK_UNAVAILABLE } = POLLING_CONFIG
export const acquireBrowserTabLease = ({
  connectionScope,
  locks = typeof navigator === 'undefined' ? null : navigator.locks,
}: {
  connectionScope: string
  locks?: LockManager | null
}): Promise<(() => void) | null> => {
  if (!locks)
    return Promise.reject(
      new SessionQueryError({ code: LOCK_UNAVAILABLE, status: null }),
    )
  return new Promise((resolve, reject) => {
    void locks
      .request(
        LOCK_PREFIX + connectionScope,
        { ifAvailable: true },
        async (lock) => {
          if (!lock) {
            resolve(null)
            return
          }
          const held = Promise.withResolvers<void>()
          resolve(() => held.resolve())
          await held.promise
        },
      )
      .catch(reject)
  })
}
