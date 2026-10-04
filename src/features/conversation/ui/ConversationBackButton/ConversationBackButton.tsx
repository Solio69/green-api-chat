'use client'

import { useId } from 'react'
import { ChatUnreadBadge } from '@/shared/ui'
import { HTML_VALUES } from '@/shared/kernel/ui/constants'
import { CONVERSATION_BACK_COPY } from './constants'
import styles from './ConversationBackButton.module.scss'

const { BUTTON } = HTML_VALUES
const { LABEL } = CONVERSATION_BACK_COPY

export const ConversationBackButton = ({
  onClick,
  unreadCount = 0,
}: {
  onClick: () => void
  unreadCount?: number
}) => {
  const badgeId = useId()
  return (
    <button
      className={styles.conversationBackButton}
      type={BUTTON}
      onClick={onClick}
      aria-label={LABEL}
      aria-describedby={unreadCount > 0 ? badgeId : undefined}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path d="m15 5-7 7 7 7" />
      </svg>
      {LABEL}
      <ChatUnreadBadge id={badgeId} count={unreadCount} compact />
    </button>
  )
}
