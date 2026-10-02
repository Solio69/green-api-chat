import type { NotificationDelivery } from './types'
import { isNotificationDelivery } from './validate-delivery'
import { rememberPersonalChat } from '@/lib/chats/session-chat-facts'
import { applyMessageFacts } from '@/lib/messages/message-cache'
import { publishMessageIssues } from '@/lib/messages/message-status-issues'
import type { QuerySession } from '@/lib/query/create-query-session'
import { SESSION_CHAT_SOURCE } from '@/lib/chats/constants'
import { MESSAGE_SOURCE } from '@/lib/messages/constants'
import { NOTIFICATION_KIND } from './constants'

const { LIVE } = MESSAGE_SOURCE
const { INCOMING: SESSION_CHAT_SOURCE_INCOMING } = SESSION_CHAT_SOURCE

const { INCOMING, STATUS } = NOTIFICATION_KIND
export const applyNotification = ({
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
    const { issues } = applyMessageFacts({
      session,
      chatId: event.chatId,
      messages: [event.message],
      source: LIVE,
    })
    publishMessageIssues({ session, issues })
    rememberPersonalChat({
      session,
      chatId: event.chatId,
      label: event.displayLabel,
      source: SESSION_CHAT_SOURCE_INCOMING,
    })
    refreshChats?.()
  } else if (event.kind === STATUS) {
    const { fact } = event
    const { chatId, idMessage } = fact
    const correlated = chatId !== null && idMessage !== null
    if (correlated) {
      const { issues } = applyMessageFacts({
        session,
        chatId,
        statuses: [{ chatId, idMessage, status: fact.status }],
        source: LIVE,
      })
      publishMessageIssues({ session, issues })
    } else
      publishMessageIssues({
        session,
        issues: [
          {
            chatId: fact.chatId,
            idMessage: null,
            code: fact.status as 'failed' | 'noAccount',
          },
        ],
      })
  }
  return true
}
