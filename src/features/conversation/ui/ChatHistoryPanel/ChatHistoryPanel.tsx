'use client'

import { useChatHistoryPanel } from './use-chat-history-panel'
import { ChatHistoryState } from '@/features/conversation/ui/ChatHistoryState'
import { MessageList } from '@/features/conversation/ui/MessageList'
import { MessageStatusIssue } from '@/features/conversation/ui/MessageStatusIssue'
import styles from './ChatHistoryPanel.module.scss'

export const ChatHistoryPanel = () => {
  const {
    target,
    chatId,
    data,
    chat,
    hasMessages,
    state,
    isFetching,
    refetch,
  } = useChatHistoryPanel()
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
      {hasMessages && data && <MessageList key={chatId} messages={data} />}
    </div>
  )
}
