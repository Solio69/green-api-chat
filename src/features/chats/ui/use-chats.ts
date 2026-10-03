'use client'

import { useQuery } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'
import type { SessionChatCache } from '@/features/chats/application'
import {
  chatsQueryOptions,
  deriveSessionChats,
  sessionChatKey,
  ChatsQueryError,
  CHAT_QUERY_CONFIG,
} from '@/features/chats/application'
import { useOptionalQuerySession } from '@/components/QueryProvider'

const { PROVIDER_REQUIRED } = CHAT_QUERY_CONFIG
export const useChats = () => {
  const session = useOptionalQuerySession()
  if (!session) throw new Error(PROVIDER_REQUIRED)
  const active = useSyncExternalStore(
    session.subscribe,
    session.isActive,
    session.isActive,
  )
  const result = useQuery({ ...chatsQueryOptions(session), enabled: active })
  const overlay = useQuery<SessionChatCache>({
    queryKey: sessionChatKey(session.connectionScope),
    enabled: false,
  })
  const data = deriveSessionChats({
    providerChats: result.data,
    overlay: overlay.data,
  })
  const refetch = async (): Promise<void> => {
    const canRefetch = session.isActive() && !result.isFetching
    if (canRefetch) await result.refetch({ cancelRefetch: false })
  }
  return {
    data: active ? data : undefined,
    isPending: active && result.isPending,
    isFetching: active && result.isFetching,
    error:
      active && result.error instanceof ChatsQueryError ? result.error : null,
    refetch,
  }
}
