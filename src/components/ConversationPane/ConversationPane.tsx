import type { ReactNode, Ref } from 'react'
import { CONVERSATION_PANE_COPY } from './constants'
import { ConversationBackground } from '@/components/ConversationBackground'
import { ConversationHeader } from '@/components/ConversationHeader'
import styles from './ConversationPane.module.scss'

const { LABEL } = CONVERSATION_PANE_COPY

export const ConversationPane = ({
  children,
  headingRef,
}: {
  children: ReactNode
  headingRef: Ref<HTMLHeadingElement>
}) => (
  <section className={styles.conversationPane} aria-label={LABEL}>
    <ConversationBackground />
    <ConversationHeader headingRef={headingRef} />
    <div className={styles.conversationPane__content}>{children}</div>
  </section>
)
