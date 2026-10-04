import { HTML_VALUES } from '@/shared/kernel/ui/constants'
import { CONVERSATION_CLOSE_COPY } from './constants'
import styles from './ConversationCloseButton.module.scss'

const { BUTTON } = HTML_VALUES
const { LABEL } = CONVERSATION_CLOSE_COPY

export const ConversationCloseButton = ({
  onClick,
}: {
  onClick: () => void
}) => (
  <button
    className={styles.conversationCloseButton}
    type={BUTTON}
    aria-label={LABEL}
    title={LABEL}
    onClick={onClick}
  >
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="m6 6 12 12M6 18 18 6" />
    </svg>
  </button>
)
