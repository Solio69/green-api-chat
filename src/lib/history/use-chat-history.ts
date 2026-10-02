'use client'

import { hashKey, useQuery } from '@tanstack/react-query'
import { useLayoutEffect, useSyncExternalStore } from 'react'
import { fetchHistory } from './fetch-history'
import { HistoryQueryError } from './types'
import { messageKey, applyHistoryMessages } from '@/lib/messages/message-cache'
import type { MessageCache, MessageDTO } from '@/lib/messages/types'
import { HISTORY_CONFIG, HISTORY_QUERY_STATE } from './constants'
import { useConversationSelection } from '@/components/ConversationSelectionProvider'
import { useOptionalQuerySession } from '@/components/QueryProvider'

const { REQUEST_KEY, PROVIDER_REQUIRED } = HISTORY_CONFIG
const { SUCCESS } = HISTORY_QUERY_STATE

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
  const requestKey = historyRequestKey({
    connectionScope: session.connectionScope,
    chatId: currentChat,
    accessId,
  })
  const requestHash = hashKey(requestKey)
  const result = useQuery({
    queryKey: requestKey,
    enabled,
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    queryFn: ({ signal }) =>
      fetchHistory({
        connectionScope: session.connectionScope,
        chatId: currentChat!,
        signal,
        isActive: session.isActive,
      }),
  })
  const merged = useQuery<MessageCache>({
    queryKey: messageKey({
      connectionScope: session.connectionScope,
      chatId: currentChat,
    }),
    enabled: false,
  })
  useLayoutEffect(() => {
    if (!currentChat) return
    const key = historyRequestKey({
      connectionScope: session.connectionScope,
      chatId: currentChat,
      accessId,
    })
    let appliedCount = 0
    const applyCompletion = () => {
      if (!session.isActive()) return
      const state = session.client.getQueryState<MessageDTO[]>(key)
      if (!state) return
      const { data } = state
      const completed =
        state.status === SUCCESS &&
        data !== undefined &&
        state.dataUpdateCount > appliedCount
      if (!completed) return
      appliedCount = state.dataUpdateCount
      applyHistoryMessages({
        session,
        chatId: currentChat,
        messages: data,
      })
    }
    const unsubscribe = session.client.getQueryCache().subscribe((event) => {
      if (event.query.queryHash !== requestHash) return
      applyCompletion()
    })
    applyCompletion()
    return unsubscribe
  }, [session, currentChat, accessId, requestHash])
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
