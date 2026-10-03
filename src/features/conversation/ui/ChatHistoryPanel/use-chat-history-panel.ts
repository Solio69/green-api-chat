'use client'

import { useEffect } from 'react'
import { useConversationSelection } from '@/features/conversation/ui/ConversationSelectionProvider'
import { useOptionalNotificationOwner } from '@/features/conversation/ui/NotificationProvider'
import { useChatHistory } from '@/lib/history/use-chat-history'
import { useConversationMessages } from '@/lib/messages/use-conversation-messages'
import { useMessageIssues } from '@/lib/messages/use-message-issues'
import { HISTORY_PANEL_STATE } from './constants'

const { LOADING, REFRESHING, EMPTY, ERROR } = HISTORY_PANEL_STATE

export const useChatHistoryPanel = () => {
  const { target } = useConversationSelection()
  const chatId = target?.chatId ?? null
  const { isPending, isFetching, error, refetch } = useChatHistory(chatId)
  const { data } = useConversationMessages(chatId)
  const owner = useOptionalNotificationOwner()
  const { chat } = useMessageIssues(chatId)
  useEffect(
    () =>
      owner?.subscribeRecovery(() => {
        if (chatId !== null) void refetch()
      }),
    [owner, chatId, refetch],
  )
  const hasMessages = data !== undefined && data.length > 0
  let state:
    (typeof HISTORY_PANEL_STATE)[keyof typeof HISTORY_PANEL_STATE] | null = null
  if (error) state = ERROR
  else if (isPending) state = LOADING
  else if (isFetching) state = REFRESHING
  else if (!hasMessages) state = EMPTY
  return { target, chatId, data, chat, hasMessages, state, isFetching, refetch }
}
