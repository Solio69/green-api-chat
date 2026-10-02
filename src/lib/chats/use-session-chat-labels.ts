'use client'

import { useQuery } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'
import { sessionChatKey } from './session-chat-facts'
import type { SessionChatCache } from './session-chat-facts'
import { CHAT_QUERY_CONFIG } from './constants'
import { useOptionalQuerySession } from '@/components/QueryProvider'

const { PROVIDER_REQUIRED } = CHAT_QUERY_CONFIG
export const useSessionChatLabels = (): Readonly<Record<string, string>> => {
  const session = useOptionalQuerySession()
  if (!session) throw new Error(PROVIDER_REQUIRED)
  const active = useSyncExternalStore(
    session.subscribe,
    session.isActive,
    session.isActive,
  )
  const result = useQuery<SessionChatCache>({
    queryKey: sessionChatKey(session.connectionScope),
    enabled: false,
  })
  return active ? (result.data?.labelsByChatId ?? {}) : {}
}
