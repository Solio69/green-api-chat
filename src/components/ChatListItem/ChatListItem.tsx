import type { PersonalChat } from '@/lib/chats/types'
import type { ConversationTarget } from '@/lib/conversations/types'
import { RECIPIENT_VALIDATION } from '@/lib/recipients/constants'
import { HTML_VALUES } from '@/lib/ui/constants'
import styles from './ChatListItem.module.scss'

const { USERNAME_PREFIX } = RECIPIENT_VALIDATION
const { BUTTON } = HTML_VALUES

type ChatListItemProps = {
  chat: PersonalChat
  isSelected: boolean
  onSelect: (target: ConversationTarget) => void
  fallbackLabel?: string
}

export const ChatListItem = ({
  chat,
  isSelected,
  onSelect,
  fallbackLabel,
}: ChatListItemProps) => {
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
        onClick={handleSelect}
      >
        <span
          className={styles.chatListItem__avatar}
          aria-hidden
          data-initial={initial.toLocaleUpperCase()}
        />
        <span className={styles.chatListItem__label}>{label}</span>
      </button>
    </li>
  )
}
