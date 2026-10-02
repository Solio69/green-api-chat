'use client'

import { useId, useState } from 'react'
import type { ChatsErrorCode } from '@/lib/chats/types'
import { useChats } from '@/lib/chats/use-chats'
import { WORKSPACE_COPY } from '@/components/ChatWorkspace/constants'
import { API_ERROR_CODE } from '@/lib/api/constants'
import { EMPTY_STRING, HTML_VALUES } from '@/lib/ui/constants'
import { CHAT_LIST_ERROR_COPY, CHAT_LIST_RECOVERY_COPY } from './constants'
import { ChatList } from '@/components/ChatList'
import styles from './ChatListPanel.module.scss'

const { CHATS } = WORKSPACE_COPY
const { BUTTON, ROLE_ALERT, ROLE_STATUS } = HTML_VALUES
const { RATE_LIMITED } = API_ERROR_CODE
const { GENERIC, RATE_LIMIT } = CHAT_LIST_ERROR_COPY
const { RETRY, RETRY_PENDING } = CHAT_LIST_RECOVERY_COPY

const readErrorCopy = (code: ChatsErrorCode) =>
  code === RATE_LIMITED ? RATE_LIMIT : GENERIC

export const ChatListPanel = () => {
  const headingId = useId()
  const { data, isPending, isFetching, error, refetch } = useChats()
  const [retryErrorCode, setRetryErrorCode] = useState<ChatsErrorCode | null>(
    null,
  )
  const errorCode = error?.code ?? retryErrorCode
  const errorCopy = errorCode && readErrorCopy(errorCode)
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
      {errorCopy ? (
        <div className={styles.chatListPanel__recovery}>
          <div className={styles.chatListPanel__error} role={ROLE_ALERT}>
            <svg
              className={styles.chatListPanel__errorIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden
              focusable="false"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v6m0 4h.01" />
            </svg>
            <div>
              <p className={styles.chatListPanel__errorTitle}>
                {errorCopy.TITLE}
              </p>
              <p className={styles.chatListPanel__errorHint}>
                {errorCopy.DESCRIPTION}
              </p>
            </div>
          </div>
          <button
            className={styles.chatListPanel__retry}
            type={BUTTON}
            disabled={isBusy}
            onClick={handleChatListRetry}
          >
            <svg
              className={styles.chatListPanel__retryIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              focusable="false"
            >
              <path d="M20 7v5h-5M4 17v-5h5M6.1 6.1A8 8 0 0 1 20 12M4 12a8 8 0 0 0 13.9 5.9" />
            </svg>
            <span className={styles.chatListPanel__retryLabels}>
              <span>{retryLabel}</span>
              <span aria-hidden>{reservedLabel}</span>
            </span>
          </button>
        </div>
      ) : (
        <ChatList chats={data} isPending={isPending} />
      )}
    </section>
  )
}
