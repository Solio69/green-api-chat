'use client'

import type { Ref } from 'react'
import { ConversationBackButton } from '@/features/conversation/ui/ConversationBackButton'
import { ConversationCloseButton } from '@/features/conversation/ui/ConversationCloseButton'
import { useConversationSelection } from '@/features/conversation/ui/ConversationSelectionProvider'
import { useUnreadCounts } from '@/features/conversation/unread/ui/use-unread-counts'
import { RECIPIENT_VALIDATION } from '@/features/recipients/model'
import { EMPTY_STRING } from '@/shared/kernel/ui/constants'
import { CONVERSATION_COPY } from './constants'
import styles from './ConversationHeader.module.scss'

const { NETWORK } = CONVERSATION_COPY
const { USERNAME_PREFIX } = RECIPIENT_VALIDATION

export const ConversationHeader = ({
  headingRef,
}: {
  headingRef: Ref<HTMLHeadingElement>
}) => {
  const { target, showChatList, closeConversation } = useConversationSelection()
  const { total } = useUnreadCounts()
  if (!target) return null
  const { label } = target
  const initial = label
    .replace(USERNAME_PREFIX, EMPTY_STRING)
    .slice(0, 1)
    .toLocaleUpperCase()
  return (
    <header className={styles.conversationHeader}>
      <ConversationBackButton onClick={showChatList} unreadCount={total} />
      <span className={styles.conversationHeader__avatar} aria-hidden>
        {initial}
      </span>
      <div className={styles.conversationHeader__identity}>
        <h2
          className={styles.conversationHeader__heading}
          ref={headingRef}
          tabIndex={-1}
        >
          {label}
        </h2>
        <p className={styles.conversationHeader__network}>{NETWORK}</p>
      </div>
      <ConversationCloseButton onClick={closeConversation} />
    </header>
  )
}
