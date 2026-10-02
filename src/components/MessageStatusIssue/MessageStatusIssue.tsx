import type { MessageIssue } from '@/lib/messages/types'
import { MESSAGE_STATUS_COPY } from '@/components/MessageStatusIndicator/constants'
import { HTML_VALUES } from '@/lib/ui/constants'
import styles from './MessageStatusIssue.module.scss'

const { ROLE_ALERT } = HTML_VALUES
export const MessageStatusIssue = ({ issue }: { issue: MessageIssue | null }) =>
  issue && (
    <p className={styles.messageStatusIssue} role={ROLE_ALERT}>
      {MESSAGE_STATUS_COPY[issue.code]}
    </p>
  )
