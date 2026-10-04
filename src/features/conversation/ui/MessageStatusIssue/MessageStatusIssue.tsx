import type { MessageIssue } from '@/features/conversation/messages/model/types'
import { MESSAGE_STATUS_COPY } from '@/features/conversation/ui/MessageStatusIndicator/constants'
import { HTML_VALUES } from '@/shared/kernel/ui/constants'
import styles from './MessageStatusIssue.module.scss'

const { ROLE_ALERT } = HTML_VALUES
export const MessageStatusIssue = ({ issue }: { issue: MessageIssue | null }) =>
  issue && (
    <p className={styles.messageStatusIssue} role={ROLE_ALERT}>
      {MESSAGE_STATUS_COPY[issue.code]}
    </p>
  )
