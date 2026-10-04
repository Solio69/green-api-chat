'use client'

import { useMessageIssues } from '@/features/conversation/messages/ui/use-message-issues'
import { MessageStatusIssue } from '@/features/conversation/ui/MessageStatusIssue'
import { useNotificationConnection } from '@/features/conversation/ui/NotificationProvider/context'
import {
  NOTIFICATION_STATE,
  NOTIFICATION_CONFIG,
  NOTIFICATION_CODE,
  POLLING_CONFIG,
} from '@/features/conversation/notifications/model/constants'
import { HTML_VALUES } from '@/shared/kernel/ui/constants'
import { NOTIFICATION_NOTICE_COPY } from './constants'
import styles from './NotificationNotice.module.scss'

const { OUTGOING_DISABLED } = NOTIFICATION_CONFIG
const { INVALID_UPSTREAM } = NOTIFICATION_CODE
const { LOCK_UNAVAILABLE } = POLLING_CONFIG
const { LIMITED, PAUSED } = NOTIFICATION_STATE
const { BUTTON, ROLE_ALERT, ROLE_STATUS } = HTML_VALUES
const {
  LIMIT,
  LOCK_UNAVAILABLE: LOCK_UNAVAILABLE_COPY,
  PAUSE,
  RETRY,
  SETTINGS,
  INVALID,
} = NOTIFICATION_NOTICE_COPY
export const NotificationNotice = () => {
  const { connection: issue } = useMessageIssues(null)
  const connection = useNotificationConnection()
  const isRestricted =
    connection.status === LIMITED || connection.status === PAUSED
  const hasSettingsIssue = connection.issue === OUTGOING_DISABLED
  const shouldShowNotice = isRestricted || hasSettingsIssue
  if (!shouldShowNotice) return <MessageStatusIssue issue={issue} />
  let noticeText: string = SETTINGS
  if (connection.status === LIMITED)
    noticeText =
      connection.issue === LOCK_UNAVAILABLE ? LOCK_UNAVAILABLE_COPY : LIMIT
  else if (connection.status === PAUSED) {
    noticeText = PAUSE
    if (connection.issue === INVALID_UPSTREAM) noticeText = INVALID
  }

  const handleRetry = () => {
    // The controller owns transport failures and recovery state.
    void connection.retry()
  }
  return (
    <>
      <MessageStatusIssue issue={issue} />
      <div
        className={styles.notificationNotice}
        role={isRestricted ? ROLE_ALERT : ROLE_STATUS}
      >
        <p>{noticeText}</p>
        {isRestricted && (
          <button type={BUTTON} onClick={handleRetry}>
            {RETRY}
          </button>
        )}
      </div>
    </>
  )
}
