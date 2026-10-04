import type { MessageDTO } from '@/features/conversation/messages/model/types'
import {
  MESSAGE_DIRECTION,
  MESSAGE_STATUS,
} from '@/features/conversation/messages/model/constants'
import { HTML_VALUES } from '@/shared/kernel/ui/constants'
import { MESSAGE_STATUS_COPY } from './constants'
import styles from './MessageStatusIndicator.module.scss'

const { OUTGOING } = MESSAGE_DIRECTION
const { ROLE_IMG: HTML_VALUES_ROLE_IMG } = HTML_VALUES

const { ACCEPTED, READ, FAILED, NO_ACCOUNT } = MESSAGE_STATUS
export const MessageStatusIndicator = ({
  message,
}: {
  message: MessageDTO
}) => {
  const visible = message.direction === OUTGOING && message.status !== null
  if (!visible) return null
  if (message.status === null) return null
  const label = MESSAGE_STATUS_COPY[message.status]
  const failure = message.status === FAILED || message.status === NO_ACCOUNT
  let mark = <path d="m5 12 4 4L19 6" />
  if (message.status === ACCEPTED)
    mark = (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    )
  else if (message.status === READ)
    mark = (
      <>
        <path d="m2 12 4 4L16 6M9 12l4 4L23 6" />
      </>
    )
  else if (failure)
    mark = (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6m0 4h.01" />
      </>
    )
  return (
    <span
      className={styles.messageStatusIndicator}
      role={HTML_VALUES_ROLE_IMG}
      aria-label={label}
      title={label}
      data-status={message.status}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {mark}
      </svg>
    </span>
  )
}
