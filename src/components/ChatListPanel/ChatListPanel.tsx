'use client'

import { useId, useState } from 'react'
import type { ChatsErrorCode } from '@/lib/chats/types'
import { useChats } from '@/lib/chats/use-chats'
import { useSessionChatLabels } from '@/lib/chats/use-session-chat-labels'
import { useUnreadCounts } from '@/lib/unread/use-unread-counts'
import { WORKSPACE_COPY } from '@/components/ChatWorkspace/constants'
import { API_ERROR_CODE } from '@/lib/api/constants'
import { EMPTY_STRING, HTML_VALUES } from '@/lib/ui/constants'
import { CHAT_LIST_ERROR_COPY, CHAT_LIST_RECOVERY_COPY } from './constants'
import { ChatList } from '@/components/ChatList'
import { ChatListRecovery } from '@/components/ChatListRecovery'
import { useConversationSelection } from '@/components/ConversationSelectionProvider'
import styles from './ChatListPanel.module.scss'

const { CHATS } = WORKSPACE_COPY
const { ROLE_STATUS } = HTML_VALUES
const { RATE_LIMITED } = API_ERROR_CODE
const { GENERIC, RATE_LIMIT } = CHAT_LIST_ERROR_COPY
const { RETRY, RETRY_PENDING } = CHAT_LIST_RECOVERY_COPY

const readErrorCopy = (code: ChatsErrorCode) =>
  code === RATE_LIMITED ? RATE_LIMIT : GENERIC

export const ChatListPanel = () => {
  const { target, openConversation } = useConversationSelection()
  const headingId = useId()
  const { data, isPending, isFetching, error, refetch } = useChats()
  const labelsByChatId = useSessionChatLabels()
  const { countsByChatId } = useUnreadCounts()
  const hasKnownItems = data !== undefined && data.length > 0
  const [retryErrorCode, setRetryErrorCode] = useState<ChatsErrorCode | null>(
    null,
  )
  const errorCode = error?.code ?? retryErrorCode
  const errorCopy = errorCode && readErrorCopy(errorCode)
  const showList = !errorCopy || hasKnownItems
  const isBusy = isPending || isFetching || retryErrorCode !== null
  const retryLabel = isBusy ? RETRY_PENDING : RETRY
  const reservedLabel = isBusy ? RETRY : RETRY_PENDING
  const pendingText = errorCopy && isBusy ? RETRY_PENDING : EMPTY_STRING

  const handleChatListRetry = async () => {
    const canRetry = error !== null && !isBusy
    if (!canRetry) return
    setRetryErrorCode(error.code)
    try {
      await refetch()
    } finally {
      setRetryErrorCode(null)
    }
  }

  return (
    <section className={styles.chatListPanel} aria-labelledby={headingId}>
      <h2 className={styles.chatListPanel__heading} id={headingId}>
        {CHATS}
      </h2>
      <span className={styles.chatListPanel__status} role={ROLE_STATUS}>
        {pendingText}
      </span>
      {errorCopy && (
        <ChatListRecovery
          title={errorCopy.TITLE}
          description={errorCopy.DESCRIPTION}
          isBusy={isBusy}
          retryLabel={retryLabel}
          reservedLabel={reservedLabel}
          onRetry={handleChatListRetry}
        />
      )}
      {showList && (
        <ChatList
          chats={data}
          labelsByChatId={labelsByChatId}
          unreadCountsByChatId={countsByChatId}
          isPending={isPending}
          selectedChatId={target?.chatId}
          onSelect={openConversation}
        />
      )}
    </section>
  )
}
