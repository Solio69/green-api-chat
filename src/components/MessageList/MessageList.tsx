'use client'

import type { ReactNode } from 'react'
import { useMessageScroll } from './use-message-scroll'
import type { MessageDTO } from '@/lib/messages/types'
import { HTML_VALUES } from '@/lib/ui/constants'
import { MESSAGE_LIST_COPY } from './constants'
import { MessageBubble } from '@/components/MessageBubble'
import { MessageStatusIndicator } from '@/components/MessageStatusIndicator'
import styles from './MessageList.module.scss'

const { LABEL } = MESSAGE_LIST_COPY
const { ARIA_LIVE_POLITE } = HTML_VALUES
export const MessageList = ({
  messages,
  renderStatus,
}: {
  messages: MessageDTO[]
  renderStatus?: (message: MessageDTO) => ReactNode
}) => {
  const { listRef, handleScroll } = useMessageScroll(messages)
  return (
    <ul
      className={styles.messageList}
      aria-label={LABEL}
      aria-live={ARIA_LIVE_POLITE}
      tabIndex={0}
      ref={listRef}
      onScroll={handleScroll}
    >
      {messages.map((message) => (
        <MessageBubble
          key={message.idMessage}
          message={message}
          status={
            renderStatus ? (
              renderStatus(message)
            ) : (
              <MessageStatusIndicator message={message} />
            )
          }
        />
      ))}
    </ul>
  )
}
