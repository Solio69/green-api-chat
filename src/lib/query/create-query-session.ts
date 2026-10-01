import { QueryCache, QueryClient } from '@tanstack/react-query'
import { fetchChats } from '@/lib/chats/fetch-chats'
import { ChatsQueryError } from '@/lib/chats/types'
import { API_ERROR_CODE } from '@/lib/api/constants'
import { CHAT_QUERY_CONFIG } from '@/lib/chats/constants'

const { KEY, STALE_TIME_MS, GC_TIME_MS } = CHAT_QUERY_CONFIG
const { SESSION_REQUIRED, CONNECTION_CHANGED } = API_ERROR_CODE
export const createQuerySession = ({
  connectionScope,
  onSessionError,
  fetcher,
}: {
  connectionScope: string
  onSessionError?: (error: ChatsQueryError) => void
  fetcher?: typeof fetch
}) => {
  let active = true
  let closing: Promise<void> | undefined
  let retained = 0
  let disposal: ReturnType<typeof setTimeout> | undefined
  const listeners = new Set<() => void>()
  const isActive = () => active
  const close = (): Promise<void> => {
    if (!active) return closing ?? Promise.resolve()
    active = false
    listeners.forEach((listener) => listener())
    closing = client.cancelQueries().finally(() => client.clear())
    return closing
  }
  const client = new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        const isSessionError =
          error instanceof ChatsQueryError &&
          (error.code === SESSION_REQUIRED || error.code === CONNECTION_CHANGED)
        if (!isSessionError) return
        if (!active) return
        // QueryCache does not await callbacks; close hides data before navigation.
        return close().then(() => onSessionError?.(error))
      },
    }),
  })
  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
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
  return { client, isActive, subscribe, close, retain, options }
}
export type QuerySession = ReturnType<typeof createQuerySession>
