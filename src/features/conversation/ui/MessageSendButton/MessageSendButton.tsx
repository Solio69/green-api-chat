import { HTML_VALUES } from '@/shared/kernel/ui/constants'
import styles from './MessageSendButton.module.scss'

const { SUBMIT } = HTML_VALUES
export const MessageSendButton = ({
  disabled,
  pending,
  label,
}: {
  disabled: boolean
  pending: boolean
  label: string
}) => (
  <button
    className={styles.messageSendButton}
    type={SUBMIT}
    disabled={disabled}
    aria-busy={pending}
    aria-label={label}
    title={label}
  >
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13" />
    </svg>
  </button>
)
