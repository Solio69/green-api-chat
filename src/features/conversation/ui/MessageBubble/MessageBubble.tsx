import type { ReactNode } from 'react'
import type { MessageDTO } from '@/features/conversation/messages/model/types'
import {
  MESSAGE_KIND,
  MESSAGE_CACHE_CONFIG,
} from '@/features/conversation/messages/model/constants'
import { MESSAGE_BUBBLE_COPY, MESSAGE_TIME_CONFIG } from './constants'
import styles from './MessageBubble.module.scss'

const { UNSUPPORTED } = MESSAGE_KIND
const { MILLISECONDS_PER_SECOND } = MESSAGE_CACHE_CONFIG
const { UNSUPPORTED: UNSUPPORTED_COPY, ACCEPTED_TIME } = MESSAGE_BUBBLE_COPY
const { LOCALE, TWO_DIGITS } = MESSAGE_TIME_CONFIG
const readTime = (message: MessageDTO) => {
  const millis =
    message.timestamp === null
      ? message.acceptedAt
      : message.timestamp * MILLISECONDS_PER_SECOND
  if (millis === null) return null
  const date = new Date(millis)
  if (!Number.isFinite(date.getTime())) return null
  return {
    iso: date.toISOString(),
    label: date.toLocaleTimeString(LOCALE, {
      hour: TWO_DIGITS,
      minute: TWO_DIGITS,
    }),
  }
}
export const MessageBubble = ({
  message,
  status = null,
}: {
  message: MessageDTO
  status?: ReactNode
}) => {
  const text = message.kind === UNSUPPORTED ? UNSUPPORTED_COPY : message.text
  const time = readTime(message)
  const isLocalTime = message.timestamp === null && message.acceptedAt !== null
  const hasMetadata = time !== null || status !== null
  return (
    <li className={styles.messageBubble} data-direction={message.direction}>
      <p className={styles.messageBubble__text}>{text}</p>
      {hasMetadata && (
        <div className={styles.messageBubble__metadata}>
          {time && (
            <time
              dateTime={time.iso}
              title={isLocalTime ? ACCEPTED_TIME : undefined}
            >
              {time.label}
            </time>
          )}
          {status}
        </div>
      )}
    </li>
  )
}
