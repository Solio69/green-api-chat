import { HTML_VALUES } from '@/lib/ui/constants'
import styles from './ChatListRecovery.module.scss'

const { BUTTON, ROLE_ALERT } = HTML_VALUES

type ChatListRecoveryProps = {
  title: string
  description: string
  isBusy: boolean
  retryLabel: string
  reservedLabel: string
  onRetry: () => Promise<void>
}

export const ChatListRecovery = ({
  title,
  description,
  isBusy,
  retryLabel,
  reservedLabel,
  onRetry,
}: ChatListRecoveryProps) => (
  <div className={styles.chatListRecovery}>
    <div className={styles.chatListRecovery__error} role={ROLE_ALERT}>
      <svg
        className={styles.chatListRecovery__errorIcon}
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
        <p className={styles.chatListRecovery__errorTitle}>{title}</p>
        <p className={styles.chatListRecovery__errorHint}>{description}</p>
      </div>
    </div>
    <button
      className={styles.chatListRecovery__retry}
      type={BUTTON}
      disabled={isBusy}
      onClick={onRetry}
    >
      <svg
        className={styles.chatListRecovery__retryIcon}
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
      <span className={styles.chatListRecovery__retryLabels}>
        <span>{retryLabel}</span>
        <span aria-hidden>{reservedLabel}</span>
      </span>
    </button>
  </div>
)
