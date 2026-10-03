import { QueryCache, QueryClient } from '@tanstack/react-query'
import { SessionQueryError } from './session-query-error'
import { API_ERROR_CODE } from '@/lib/api/constants'
import { HTTP_STATUS } from '@/lib/http/constants'

const { SESSION_REQUIRED, CONNECTION_CHANGED } = API_ERROR_CODE
const { UNAUTHORIZED, CONFLICT } = HTTP_STATUS

const invokeCleanup = (callback: () => void) => {
  try {
    callback()
  } catch {
    /* One resource must not prevent the remaining cleanup. */
  }
}
export const createQuerySession = ({
  connectionScope,
  onSessionError,
  fetcher,
}: {
  connectionScope: string
  onSessionError?: (error: SessionQueryError) => void
  fetcher?: typeof fetch
}) => {
  let active = true
  let closing: Promise<void> | undefined
  let retained = 0
  let disposal: ReturnType<typeof setTimeout> | undefined
  const listeners = new Set<() => void>()
  const cleanups = new Set<() => void>()
  const isActive = () => active
  const close = (): Promise<void> => {
    if (!active) return closing ?? Promise.resolve()
    active = false
    cleanups.forEach(invokeCleanup)
    cleanups.clear()
    listeners.forEach(invokeCleanup)
    closing = client.cancelQueries().finally(() => client.clear())
    return closing
  }
  const handleSessionError = async (
    error: SessionQueryError,
  ): Promise<void> => {
    const isSessionError =
      error instanceof SessionQueryError &&
      ((error.code === SESSION_REQUIRED && error.status === UNAUTHORIZED) ||
        (error.code === CONNECTION_CHANGED && error.status === CONFLICT))
    if (!isSessionError || !active) return
    await close()
    onSessionError?.(error)
  }
  const client = new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        if (!(error instanceof SessionQueryError)) return
        // QueryCache does not await this callback; the session owns closing and navigation.
        void handleSessionError(error)
      },
    }),
  })
  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }
  const registerCleanup = (callback: () => void) => {
    if (!active) {
      invokeCleanup(callback)
      return () => undefined
    }
    cleanups.add(callback)
    return () => {
      cleanups.delete(callback)
    }
  }
  const retain = () => {
    retained += 1
    clearTimeout(disposal)
    return () => {
      retained -= 1
      if (retained !== 0) return
      // Allow synchronous StrictMode setup/cleanup/setup before final disposal.
      disposal = setTimeout(() => {
        close().catch(() => undefined)
      }, 0)
    }
  }
  return {
    client,
    connectionScope,
    fetcher,
    isActive,
    subscribe,
    close,
    retain,
    registerCleanup,
    handleSessionError,
  } as const
}
export type QuerySession = ReturnType<typeof createQuerySession>
