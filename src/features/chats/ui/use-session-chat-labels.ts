'use client'

import { useQuery } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'
import type { SessionChatCache } from '@/features/chats/application'
import { sessionChatKey, CHAT_QUERY_CONFIG } from '@/features/chats/application'
import { useOptionalQuerySession } from '@/shared/query/ui'

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
