import type { QuerySession } from '@/lib/query/create-query-session'
import { UNREAD_CONFIG } from './constants'

const { KEY } = UNREAD_CONFIG
export type UnreadCache = {
  seenByChatId: Readonly<Record<string, readonly string[]>>
  unreadByChatId: Readonly<Record<string, readonly string[]>>
  readableChatId: string | null
}

export const unreadKey = (connectionScope: string) =>
  [KEY, connectionScope] as const
const emptyCache = (): UnreadCache => ({
  seenByChatId: {},
  unreadByChatId: {},
  readableChatId: null,
})
const readIds = ({
  byChatId,
  chatId,
}: {
  byChatId: Readonly<Record<string, readonly string[]>>
  chatId: string
}) => (Object.hasOwn(byChatId, chatId) ? byChatId[chatId] : [])

export const recordIncomingUnread = ({
  session,
  chatId,
  idMessage,
}: {
  session: QuerySession
  chatId: string
  idMessage: string
}): void => {
  if (!session.isActive()) return
  session.client.setQueryData<UnreadCache>(
    unreadKey(session.connectionScope),
    (current = emptyCache()) => {
      const seen = readIds({ byChatId: current.seenByChatId, chatId })
      if (seen.includes(idMessage)) return current
      const unread = readIds({ byChatId: current.unreadByChatId, chatId })
      const isBeingRead = current.readableChatId === chatId
      return {
        ...current,
        seenByChatId: {
          ...current.seenByChatId,
          [chatId]: [...seen, idMessage],
        },
        unreadByChatId: isBeingRead
          ? current.unreadByChatId
          : { ...current.unreadByChatId, [chatId]: [...unread, idMessage] },
      }
    },
  )
}

export const setReadableConversation = ({
  session,
  chatId,
}: {
  session: QuerySession
  chatId: string | null
}): void => {
  if (!session.isActive()) return
  session.client.setQueryData<UnreadCache>(
    unreadKey(session.connectionScope),
    (current = emptyCache()) => {
      const hasUnread =
        chatId !== null && Object.hasOwn(current.unreadByChatId, chatId)
      const unchanged = current.readableChatId === chatId && !hasUnread
      if (unchanged) return current
      const unread = new Map(Object.entries(current.unreadByChatId))
      if (chatId !== null) unread.delete(chatId)
      return {
        ...current,
        readableChatId: chatId,
        unreadByChatId: Object.fromEntries(unread),
      }
    },
  )
}

export const deriveUnreadCounts = (cache: UnreadCache | undefined) => {
  const entries = Object.entries(cache?.unreadByChatId ?? {}).map(
    ([chatId, ids]) => [chatId, ids.length] as const,
  )
  const countsByChatId: Readonly<Record<string, number>> =
    Object.fromEntries(entries)
  return {
    countsByChatId,
    total: entries.reduce((sum, [, count]) => sum + count, 0),
  }
}
