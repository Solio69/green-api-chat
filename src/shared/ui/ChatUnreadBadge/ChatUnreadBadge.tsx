import { HTML_VALUES } from '@/shared/kernel/ui/constants'
import { UNREAD_BADGE_CONFIG } from './constants'
import styles from './ChatUnreadBadge.module.scss'

const { ROLE_IMG } = HTML_VALUES
const { MAX_VISIBLE_COUNT, OVERFLOW_LABEL, COUNT_LABEL } = UNREAD_BADGE_CONFIG

export const ChatUnreadBadge = ({
  count,
  compact = false,
  id,
}: {
  count: number
  compact?: boolean
  id?: string
}) => {
  if (count <= 0) return null
  const label = count > MAX_VISIBLE_COUNT ? OVERFLOW_LABEL : String(count)
  const className = compact
    ? `${styles.chatUnreadBadge} ${styles['chatUnreadBadge--compact']}`
    : styles.chatUnreadBadge
  return (
    <span
      className={className}
      id={id}
      role={ROLE_IMG}
      aria-label={`${COUNT_LABEL} ${count}`}
    >
      {label}
    </span>
  )
}
