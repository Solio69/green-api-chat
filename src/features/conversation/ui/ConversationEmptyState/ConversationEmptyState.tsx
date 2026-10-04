import { ConversationBackground } from '@/features/conversation/ui/ConversationBackground'
import { EMPTY_CONVERSATION_COPY } from './constants'
import styles from './ConversationEmptyState.module.scss'

const { LABEL, HEADING, HINT } = EMPTY_CONVERSATION_COPY

export const ConversationEmptyState = () => (
  <section className={styles.conversationEmptyState} aria-label={LABEL}>
    <ConversationBackground />
    <div className={styles.conversationEmptyState__content}>
      <span className={styles.conversationEmptyState__icon} aria-hidden>
        <svg
          viewBox="0 0 32 32"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M5 5h20v15H13l-8 6V5Z" />
          <path d="M12 10h17v17l-6-4h-6" />
        </svg>
      </span>
      <h2 className={styles.conversationEmptyState__heading}>{HEADING}</h2>
      <p className={styles.conversationEmptyState__hint}>{HINT}</p>
    </div>
  </section>
)
