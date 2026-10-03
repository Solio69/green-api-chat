import { fetchChats } from './fetch-chats'
import { reconcileSessionChats } from './session-chat-facts'
import type { QuerySession } from '@/lib/query/create-query-session'
import { CHAT_QUERY_CONFIG } from './constants'

const { KEY, STALE_TIME_MS, GC_TIME_MS } = CHAT_QUERY_CONFIG

export const chatsQueryOptions = (session: QuerySession) => ({
  queryKey: [KEY, session.connectionScope] as const,
  staleTime: STALE_TIME_MS,
  gcTime: GC_TIME_MS,
  retry: false as const,
  refetchOnMount: true as const,
  refetchOnWindowFocus: false as const,
  refetchOnReconnect: true as const,
  refetchInterval: false as const,
  enabled: session.isActive(),
  queryFn: async ({ signal }: { signal: AbortSignal }) => {
    const chats = await fetchChats({
      connectionScope: session.connectionScope,
      signal,
      isActive: session.isActive,
      fetcher: session.fetcher,
    })
    reconcileSessionChats({ session, providerChats: chats })
    return chats
  },
})
