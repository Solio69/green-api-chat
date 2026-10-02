import { HTML_VALUES } from '@/lib/ui/constants'
import { CONVERSATION_BACK_COPY } from './constants'
import styles from './ConversationBackButton.module.scss'

const { BUTTON } = HTML_VALUES
const { LABEL } = CONVERSATION_BACK_COPY

export const ConversationBackButton = ({
  onClick,
}: {
  onClick: () => void
}) => (
  <button
    className={styles.conversationBackButton}
    type={BUTTON}
    onClick={onClick}
  >
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="m15 5-7 7 7 7" />
    </svg>
    {LABEL}
  </button>
)
