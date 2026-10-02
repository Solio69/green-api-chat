'use client'

import { hashKey } from '@tanstack/react-query'
import type { Query } from '@tanstack/react-query'
import { useLayoutEffect } from 'react'
import { HistoryQueryError } from '@/lib/history/types'
import {
  historyRequestKey,
  useChatHistory,
} from '@/lib/history/use-chat-history'
import type { MessageDTO } from '@/lib/messages/types'
import { HISTORY_CONFIG, HISTORY_QUERY_STATE } from '@/lib/history/constants'
import { HISTORY_CONSOLE_LABEL } from './constants'
import { useConversationSelection } from '@/components/ConversationSelectionProvider'
import { useOptionalQuerySession } from '@/components/QueryProvider'

const { COUNT } = HISTORY_CONFIG
const { SUCCESS, ERROR } = HISTORY_QUERY_STATE
const { SUCCESS: SUCCESS_LABEL, ERROR: ERROR_LABEL } = HISTORY_CONSOLE_LABEL
const published = new WeakMap<Query, { success: number; error: number }>()

export const ChatHistoryController = () => {
  const session = useOptionalQuerySession()
  const { target, accessId } = useConversationSelection()
  useChatHistory(target?.chatId ?? null)
  const chatId = target?.chatId ?? null
  useLayoutEffect(() => {
    const canObserve = session !== null && chatId !== null && session.isActive()
    if (!canObserve) return
    const key = historyRequestKey({
      connectionScope: session.connectionScope,
      chatId,
      accessId,
    })
    const requestHash = hashKey(key)
    const publishCompletion = () => {
      if (!session.isActive()) return
      const query = session.client
        .getQueryCache()
        .find({ queryKey: key, exact: true })
      if (!query) return
      const state = session.client.getQueryState<MessageDTO[]>(key)
      if (!state) return
      const seen = published.get(query) ?? { success: 0, error: 0 }
      const success =
        state.status === SUCCESS &&
        state.data !== undefined &&
        state.dataUpdateCount > seen.success
      const error = state.error
      const failure =
        state.status === ERROR &&
        error instanceof HistoryQueryError &&
        state.errorUpdateCount > seen.error
      if (success) {
        published.set(query, { ...seen, success: state.dataUpdateCount })
        console.log(SUCCESS_LABEL, {
          chatId,
          count: COUNT,
          messages: state.data,
        })
      } else if (failure) {
        published.set(query, { ...seen, error: state.errorUpdateCount })
        console.error(ERROR_LABEL, {
          chatId,
          count: COUNT,
          code: error.code,
          status: error.status,
        })
      }
    }
    const unsubscribe = session.client.getQueryCache().subscribe((event) => {
      if (event.query.queryHash !== requestHash) return
      publishCompletion()
    })
    publishCompletion()
    return unsubscribe
  }, [session, chatId, accessId])
  return null
}
