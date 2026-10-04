import { CancelledError, notifyManager } from '@tanstack/react-query'
import { rememberPersonalChat } from '@/features/chats/application'
import {
  isChatId,
  isPersonalChatId,
  SESSION_CHAT_SOURCE,
} from '@/features/chats/model'
import { fetchHistory } from '@/features/conversation/history/application/fetch-history'
import {
  addAcceptedMessage,
  applyHistoryMessages,
  applyMessageFacts,
} from '@/features/conversation/messages/application/message-cache'
import { publishMessageIssues } from '@/features/conversation/messages/application/message-status-issues'
import type {
  MessageApplyResult,
  MessageDTO,
} from '@/features/conversation/messages/model/types'
import type { NotificationDelivery } from '@/features/conversation/notifications/model/types'
import { isNotificationDelivery } from '@/features/conversation/notifications/model/validate-delivery'
import type { ConversationTarget } from '@/features/conversation/selection/model'
import { recordIncomingUnread } from '@/features/conversation/unread/application/unread-cache'
import type { QuerySession } from '@/shared/query/create-query-session'
import {
  MESSAGE_CACHE_CONFIG,
  MESSAGE_SOURCE,
  MESSAGE_STATUS,
} from '@/features/conversation/messages/model/constants'
import { NOTIFICATION_KIND } from '@/features/conversation/notifications/model/constants'

const { INVALID_FACTS } = MESSAGE_CACHE_CONFIG
const { INCOMING: CHAT_INCOMING, ACCEPTED: CHAT_ACCEPTED } = SESSION_CHAT_SOURCE
const { LIVE } = MESSAGE_SOURCE
const { FAILED, NO_ACCOUNT } = MESSAGE_STATUS
const { INCOMING, STATUS } = NOTIFICATION_KIND

export const applyConversationHistory = ({
  session,
  chatId,
  messages,
}: {
  session: QuerySession
  chatId: string
  messages: MessageDTO[]
}): MessageApplyResult =>
  notifyManager.batch(() => {
    const applied = applyHistoryMessages({ session, chatId, messages })
    publishMessageIssues({ session, issues: applied.issues })
    return applied
  })

export const fetchAndApplyConversationHistory = async ({
  session,
  chatId,
  signal,
  fetcher,
}: {
  session: QuerySession
  chatId: string
  signal: AbortSignal
  fetcher?: typeof fetch
}): Promise<MessageDTO[]> => {
  const messages = await fetchHistory({
    connectionScope: session.connectionScope,
    chatId,
    signal,
    isActive: session.isActive,
    fetcher,
  })
  if (signal.aborted || !session.isActive())
    throw new CancelledError({ silent: true })
  applyConversationHistory({ session, chatId, messages })
  return messages
}

export const applyAcceptedConversation = ({
  session,
  target,
  idMessage,
  text,
  acceptedAt,
}: {
  session: QuerySession
  target: ConversationTarget
  idMessage: string
  text: string
  acceptedAt: number
}): MessageApplyResult => {
  if (!session.isActive()) return { issues: [] }
  const valid =
    isPersonalChatId(target.chatId) &&
    target.label.trim().length > 0 &&
    isChatId(idMessage)
  if (!valid) throw new Error(INVALID_FACTS)
  return notifyManager.batch(() => {
    const applied = addAcceptedMessage({
      session,
      chatId: target.chatId,
      idMessage,
      text,
      acceptedAt,
    })
    publishMessageIssues({ session, issues: applied.issues })
    rememberPersonalChat({
      session,
      chatId: target.chatId,
      label: target.label,
      source: CHAT_ACCEPTED,
    })
    return applied
  })
}

export const applyConversationDelivery = ({
  session,
  delivery,
  ownerEpoch,
  refreshChats,
}: {
  session: QuerySession
  delivery: NotificationDelivery
  ownerEpoch: string
  refreshChats?: () => void
}): boolean => {
  const valid =
    session.isActive() &&
    isNotificationDelivery(delivery) &&
    delivery.connectionScope === session.connectionScope &&
    delivery.ownerEpoch === ownerEpoch
  if (!valid) return false
  const { event } = delivery
  if (event.kind === INCOMING) {
    notifyManager.batch(() => {
      const applied = applyMessageFacts({
        session,
        chatId: event.chatId,
        messages: [event.message],
        source: LIVE,
      })
      publishMessageIssues({ session, issues: applied.issues })
      rememberPersonalChat({
        session,
        chatId: event.chatId,
        label: event.displayLabel,
        source: CHAT_INCOMING,
      })
      recordIncomingUnread({
        session,
        chatId: event.chatId,
        idMessage: event.message.idMessage,
      })
    })
    refreshChats?.()
  } else if (event.kind === STATUS) {
    const { chatId, idMessage, status } = event.fact
    if (chatId !== null && idMessage !== null) {
      notifyManager.batch(() => {
        const applied = applyMessageFacts({
          session,
          chatId,
          statuses: [{ chatId, idMessage, status }],
          source: LIVE,
        })
        publishMessageIssues({ session, issues: applied.issues })
      })
    } else if (status === FAILED || status === NO_ACCOUNT) {
      publishMessageIssues({
        session,
        issues: [{ chatId, idMessage: null, code: status }],
      })
    }
  }
  return true
}
