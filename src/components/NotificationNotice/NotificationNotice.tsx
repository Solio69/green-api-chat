'use client'

import { useMessageIssues } from '@/lib/messages/use-message-issues'
import {
  NOTIFICATION_STATE,
  NOTIFICATION_CONFIG,
  NOTIFICATION_CODE,
  POLLING_CONFIG,
} from '@/lib/notifications/constants'
import { HTML_VALUES } from '@/lib/ui/constants'
import { NOTIFICATION_NOTICE_COPY } from './constants'
import { MessageStatusIssue } from '@/components/MessageStatusIssue'
import { useNotificationConnection } from '@/components/NotificationProvider/context'
import styles from './NotificationNotice.module.scss'

const { OUTGOING_DISABLED } = NOTIFICATION_CONFIG
const { INVALID_UPSTREAM } = NOTIFICATION_CODE
const { LOCK_UNAVAILABLE } = POLLING_CONFIG
const { LIMITED, PAUSED, RETRYING } = NOTIFICATION_STATE
const { BUTTON, ROLE_ALERT, ROLE_STATUS } = HTML_VALUES
const {
  LIMIT,
  LOCK_UNAVAILABLE: LOCK_UNAVAILABLE_COPY,
  PAUSE,
  RETRY,
  RECONNECTING,
  SETTINGS,
  INVALID,
} = NOTIFICATION_NOTICE_COPY
export const NotificationNotice = () => {
  const { connection: issue } = useMessageIssues(null)
  const connection = useNotificationConnection()
  const restricted =
    connection.status === LIMITED || connection.status === PAUSED
  const reconnecting = connection.status === RETRYING
  const settingsIssue = connection.issue === OUTGOING_DISABLED
  const visible = restricted || reconnecting || settingsIssue
  if (!visible) return <MessageStatusIssue issue={issue} />
  let copy: string = SETTINGS
  if (connection.status === LIMITED)
    copy = connection.issue === LOCK_UNAVAILABLE ? LOCK_UNAVAILABLE_COPY : LIMIT
  else if (connection.status === PAUSED) {
    copy = PAUSE
    if (connection.issue === INVALID_UPSTREAM) copy = INVALID
  } else if (reconnecting) copy = RECONNECTING
  return (
    <>
      <MessageStatusIssue issue={issue} />
      <div
        className={styles.notificationNotice}
        role={restricted ? ROLE_ALERT : ROLE_STATUS}
      >
        <p>{copy}</p>
        {restricted && (
          <button type={BUTTON} onClick={connection.retry}>
            {RETRY}
          </button>
        )}
      </div>
    </>
  )
}
