import type { ReactNode, Ref } from 'react'
import { ConversationBackground } from '@/features/conversation/ui/ConversationBackground'
import { ConversationHeader } from '@/features/conversation/ui/ConversationHeader'
import { CONVERSATION_PANE_COPY } from './constants'
import styles from './ConversationPane.module.scss'

const { LABEL } = CONVERSATION_PANE_COPY

export const ConversationPane = ({
  children,
  composer,
  headingRef,
}: {
  children: ReactNode
  composer?: ReactNode
  headingRef: Ref<HTMLHeadingElement>
}) => (
  <section className={styles.conversationPane} aria-label={LABEL}>
    <ConversationBackground />
    <ConversationHeader headingRef={headingRef} />
    <div className={styles.conversationPane__content}>{children}</div>
    {composer}
  </section>
)
