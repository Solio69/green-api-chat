import type { PersonalChat } from '@/lib/chats/types'
import { RECIPIENT_VALIDATION } from '@/lib/recipients/constants'
import { HTML_VALUES } from '@/lib/ui/constants'
import { CHAT_LIST_COPY } from './constants'
import styles from './ChatList.module.scss'

const { USERNAME_PREFIX } = RECIPIENT_VALIDATION
const { ROLE_STATUS } = HTML_VALUES
const { LABEL, LOADING, EMPTY } = CHAT_LIST_COPY

type ChatListProps = {
  chats: PersonalChat[] | undefined
  isPending: boolean
}

export const ChatList = ({ chats, isPending }: ChatListProps) => {
  const hasData = chats !== undefined
  const isEmpty = hasData && chats.length === 0
  const hasItems = hasData && !isEmpty
  const isInitialLoading = !hasData && isPending

  return (
    <div className={styles.chatList}>
      {isInitialLoading && (
        <p className={styles.chatList__status} role={ROLE_STATUS}>
          {LOADING}
        </p>
      )}
      {hasItems && (
        <ul className={styles.chatList__items} aria-label={LABEL}>
          {chats.map(({ chatId, name, username, phone }) => {
            const label = name || username || phone || chatId
            const initialSource = label.trim()
            const initial = initialSource.startsWith(USERNAME_PREFIX)
              ? initialSource.slice(
                  USERNAME_PREFIX.length,
                  USERNAME_PREFIX.length + 1,
                )
              : initialSource.slice(0, 1)

            return (
              <li className={styles.chatList__item} key={chatId}>
                <span
                  className={styles.chatList__avatar}
                  aria-hidden
                  data-initial={initial.toLocaleUpperCase()}
                />
                <span className={styles.chatList__label}>{label}</span>
              </li>
            )
          })}
        </ul>
      )}
      {isEmpty && <p className={styles.chatList__empty}>{EMPTY}</p>}
    </div>
  )
}
