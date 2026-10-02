import { QueryCache, QueryClient } from '@tanstack/react-query'
import { SessionQueryError } from './session-query-error'
import { fetchChats } from '@/lib/chats/fetch-chats'
import { API_ERROR_CODE } from '@/lib/api/constants'
import { CHAT_QUERY_CONFIG } from '@/lib/chats/constants'
import { HTTP_STATUS } from '@/lib/http/constants'
import { MESSAGE_CACHE_CONFIG } from '@/lib/messages/constants'

const { KEY, STALE_TIME_MS, GC_TIME_MS } = CHAT_QUERY_CONFIG
const { KEY: MESSAGE_KEY, GC_TIME: MESSAGE_GC_TIME } = MESSAGE_CACHE_CONFIG
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
    const shouldRetire = isSessionError && active
    if (!shouldRetire) return
    await close()
    onSessionError?.(error)
  }
  const client = new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        if (!(error instanceof SessionQueryError)) return
        return handleSessionError(error)
      },
    }),
  })
  client.setQueryDefaults([MESSAGE_KEY], {
    gcTime: MESSAGE_GC_TIME,
    enabled: false,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
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
  const options = () => ({
    queryKey: [KEY, connectionScope],
    staleTime: STALE_TIME_MS,
    gcTime: GC_TIME_MS,
    retry: false as const,
    refetchOnMount: true as const,
    refetchOnWindowFocus: false as const,
    refetchOnReconnect: true as const,
    refetchInterval: false as const,
    enabled: active,
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      fetchChats({ connectionScope, signal, isActive, fetcher }),
  })
  return {
    client,
    connectionScope,
    isActive,
    subscribe,
    close,
    retain,
    options,
    registerCleanup,
    handleSessionError,
  } as const
}
export type QuerySession = ReturnType<typeof createQuerySession>
