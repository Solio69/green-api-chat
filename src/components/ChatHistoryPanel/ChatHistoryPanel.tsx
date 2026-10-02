'use client'

import { useEffect } from 'react'
import { useChatHistory } from '@/lib/history/use-chat-history'
import { useConversationMessages } from '@/lib/messages/use-conversation-messages'
import { useMessageIssues } from '@/lib/messages/use-message-issues'
import { HISTORY_PANEL_STATE } from './constants'
import { ChatHistoryState } from '@/components/ChatHistoryState'
import { useConversationSelection } from '@/components/ConversationSelectionProvider'
import { MessageList } from '@/components/MessageList'
import { MessageStatusIssue } from '@/components/MessageStatusIssue'
import { useOptionalNotificationOwner } from '@/components/NotificationProvider'
import styles from './ChatHistoryPanel.module.scss'

const { LOADING, REFRESHING, EMPTY, ERROR } = HISTORY_PANEL_STATE
export const ChatHistoryPanel = () => {
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
  if (!target) return null
  return (
    <div className={styles.chatHistoryPanel}>
      <MessageStatusIssue issue={chat} />
      {state && (
        <ChatHistoryState
          kind={state}
          compact={hasMessages}
          isBusy={isFetching}
          onRetry={refetch}
        />
      )}
      {hasMessages && <MessageList key={chatId} messages={data} />}
    </div>
  )
}
