import type { PersonalChat } from '@/lib/chats/types'
import type { ConversationTarget } from '@/lib/conversations/types'
import { HTML_VALUES } from '@/lib/ui/constants'
import { CHAT_LIST_COPY } from './constants'
import { ChatListItem } from '@/components/ChatListItem'
import styles from './ChatList.module.scss'

const { ROLE_STATUS } = HTML_VALUES
const { LABEL, LOADING, EMPTY } = CHAT_LIST_COPY

type ChatListProps = {
  chats: PersonalChat[] | undefined
  isPending: boolean
  selectedChatId?: string
  labelsByChatId?: Readonly<Record<string, string>>
  unreadCountsByChatId?: Readonly<Record<string, number>>
  onSelect: (target: ConversationTarget) => void
}

export const ChatList = ({
  chats,
  isPending,
  selectedChatId,
  labelsByChatId,
  unreadCountsByChatId,
  onSelect,
}: ChatListProps) => {
  const hasData = chats !== undefined
  const isEmpty = hasData && chats.length === 0
  const hasItems = hasData && !isEmpty
  const isInitialLoading = !hasData && isPending
  const readFallbackLabel = (chatId: string) => {
    const hasLabel =
      labelsByChatId !== undefined && Object.hasOwn(labelsByChatId, chatId)
    return hasLabel ? labelsByChatId[chatId] : undefined
  }

  const readUnreadCount = (chatId: string) => {
    const hasCount =
      unreadCountsByChatId !== undefined &&
      Object.hasOwn(unreadCountsByChatId, chatId)
    return hasCount ? unreadCountsByChatId[chatId] : 0
  }

  return (
    <div className={styles.chatList}>
      {isInitialLoading && (
        <p className={styles.chatList__status} role={ROLE_STATUS}>
          {LOADING}
        </p>
      )}
      {hasItems && (
        <ul className={styles.chatList__items} aria-label={LABEL}>
          {chats.map((chat) => (
            <ChatListItem
              key={chat.chatId}
              chat={chat}
              fallbackLabel={readFallbackLabel(chat.chatId)}
              isSelected={selectedChatId === chat.chatId}
              unreadCount={readUnreadCount(chat.chatId)}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
      {isEmpty && <p className={styles.chatList__empty}>{EMPTY}</p>}
    </div>
  )
}
