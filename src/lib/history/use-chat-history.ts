'use client'

import { CancelledError, useQuery } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'
import { HistoryQueryError } from './types'
import { useConversationSelection } from '@/features/conversation/ui/ConversationSelectionProvider'
import { fetchAndApplyConversationHistory } from '@/lib/conversations/conversation-cache-coordinator'
import { messageKey } from '@/lib/messages/message-cache'
import type { MessageCache } from '@/lib/messages/types'
import { HISTORY_CONFIG } from './constants'
import { useOptionalQuerySession } from '@/components/QueryProvider'

const { REQUEST_KEY, PROVIDER_REQUIRED } = HISTORY_CONFIG

export const historyRequestKey = ({
  connectionScope,
  chatId,
  accessId,
}: {
  connectionScope: string
  chatId: string | null
  accessId: number
}) => [REQUEST_KEY, connectionScope, chatId, accessId] as const

export const useChatHistory = (chatId: string | null) => {
  const session = useOptionalQuerySession()
  if (!session) throw new Error(PROVIDER_REQUIRED)
  const { target, accessId } = useConversationSelection()
  const active = useSyncExternalStore(
    session.subscribe,
    session.isActive,
    session.isActive,
  )
  const enabled = active && chatId !== null && target?.chatId === chatId
  const currentChat = enabled ? chatId : null
  const result = useQuery({
    queryKey: historyRequestKey({
      connectionScope: session.connectionScope,
      chatId: currentChat,
      accessId,
    }),
    enabled,
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    queryFn: ({ signal }) => {
      if (currentChat === null) throw new CancelledError({ silent: true })
      return fetchAndApplyConversationHistory({
        session,
        chatId: currentChat,
        signal,
      })
    },
  })
  const merged = useQuery<MessageCache>({
    queryKey: messageKey({
      connectionScope: session.connectionScope,
      chatId: currentChat,
    }),
    enabled: false,
  })
  const refetch = async (): Promise<void> => {
    const canRefetch = enabled && session.isActive() && !result.isFetching
    if (canRefetch) await result.refetch({ cancelRefetch: false })
  }
  return {
    data: enabled ? merged.data?.messages : undefined,
    isPending: enabled && result.isPending,
    isFetching: enabled && result.isFetching,
    error:
      enabled && result.error instanceof HistoryQueryError
        ? result.error
        : null,
    refetch,
  }
}
