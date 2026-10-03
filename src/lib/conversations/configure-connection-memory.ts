import { skipToken } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { SESSION_CHAT_CONFIG } from '@/features/chats/application'
import { MESSAGE_CACHE_CONFIG } from '@/lib/messages/constants'
import { UNREAD_CONFIG } from '@/lib/unread/constants'

const {
  KEY: MESSAGE_KEY,
  STATUS_FACTS_KEY,
  ISSUES_KEY,
  GC_TIME,
} = MESSAGE_CACHE_CONFIG
const { KEY: SESSION_CHAT_KEY } = SESSION_CHAT_CONFIG
const { KEY: UNREAD_KEY } = UNREAD_CONFIG

export const configureConnectionMemory = (client: QueryClient): void => {
  const defaults = {
    queryFn: skipToken,
    structuralSharing: false,
    gcTime: GC_TIME,
    enabled: false,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  } as const
  for (const key of [
    MESSAGE_KEY,
    STATUS_FACTS_KEY,
    ISSUES_KEY,
    SESSION_CHAT_KEY,
    UNREAD_KEY,
  ])
    client.setQueryDefaults([key], defaults)
}
