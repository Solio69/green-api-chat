'use client'

import { useId } from 'react'
import { RECIPIENT_VALIDATION } from '@/features/recipients/model'
import type { PersonalChat } from '@/lib/chats/types'
import type { ConversationTarget } from '@/lib/conversations/types'
import { HTML_VALUES } from '@/lib/ui/constants'
import { ChatUnreadBadge } from '@/components/ChatUnreadBadge'
import styles from './ChatListItem.module.scss'

const { USERNAME_PREFIX } = RECIPIENT_VALIDATION
const { BUTTON } = HTML_VALUES

type ChatListItemProps = {
  chat: PersonalChat
  isSelected: boolean
  onSelect: (target: ConversationTarget) => void
  fallbackLabel?: string
  unreadCount?: number
}

export const ChatListItem = ({
  chat,
  isSelected,
  onSelect,
  fallbackLabel,
  unreadCount = 0,
}: ChatListItemProps) => {
  const badgeId = useId()
  const { chatId, name, username, phone } = chat
  const label = name || username || phone || fallbackLabel || chatId
  const initialSource = label.trim()
  const initial = initialSource.startsWith(USERNAME_PREFIX)
    ? initialSource.slice(USERNAME_PREFIX.length, USERNAME_PREFIX.length + 1)
    : initialSource.slice(0, 1)
  const handleSelect = () => onSelect({ chatId, label })

  return (
    <li>
      <button
        className={styles.chatListItem}
        type={BUTTON}
        aria-pressed={isSelected}
        aria-label={label}
        aria-describedby={unreadCount > 0 ? badgeId : undefined}
        onClick={handleSelect}
      >
        <span
          className={styles.chatListItem__avatar}
          aria-hidden
          data-initial={initial.toLocaleUpperCase()}
        />
        <span className={styles.chatListItem__label}>{label}</span>
        <ChatUnreadBadge id={badgeId} count={unreadCount} />
      </button>
    </li>
  )
}
