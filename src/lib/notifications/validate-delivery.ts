import type { NotificationDelivery } from './types'
import { isChatId, isPersonalChatId } from '@/features/chats/model'
import { isRecord } from '@/lib/api/is-record'
import { isMessageDTO } from '@/lib/messages/validate-message'
import { MESSAGE_DIRECTION, MESSAGE_STATUS } from '@/lib/messages/constants'
import { NOTIFICATION_CONFIG, NOTIFICATION_KIND } from './constants'

const { IGNORED_REASON, UNSUPPORTED_REASON } = NOTIFICATION_CONFIG
const { INCOMING: DIRECTION_INCOMING } = MESSAGE_DIRECTION

const { INCOMING, STATUS, IGNORED } = NOTIFICATION_KIND
const { DELIVERED, READ, FAILED, NO_ACCOUNT } = MESSAGE_STATUS
export const isNotificationDelivery = (
  value: unknown,
): value is NotificationDelivery => {
  if (!isRecord(value)) return false
  const identity =
    isChatId(value.connectionScope) &&
    isChatId(value.ownerEpoch) &&
    isChatId(value.deliveryId)
  if (!identity) return false
  const event = value.event
  if (!isRecord(event)) return false
  if (event.kind === IGNORED)
    return (
      event.reason === IGNORED_REASON || event.reason === UNSUPPORTED_REASON
    )
  if (event.kind === INCOMING) {
    const valid =
      isPersonalChatId(event.chatId) &&
      isMessageDTO(event.message) &&
      event.message.chatId === event.chatId &&
      event.message.direction === DIRECTION_INCOMING &&
      event.message.timestamp !== null &&
      event.message.acceptedAt === null &&
      event.message.status === null &&
      (event.displayLabel === null ||
        (typeof event.displayLabel === 'string' &&
          event.displayLabel.trim().length > 0))
    return valid
  }
  if (event.kind !== STATUS) return false
  const fact = event.fact
  if (!isRecord(fact)) return false
  const validIdentity =
    (fact.chatId === null || isPersonalChatId(fact.chatId)) &&
    (fact.idMessage === null || isChatId(fact.idMessage))
  const validTimestamp =
    fact.timestamp === null ||
    (typeof fact.timestamp === 'number' &&
      Number.isSafeInteger(fact.timestamp) &&
      fact.timestamp >= 0)
  const validFact = validIdentity && validTimestamp
  if (!validFact) return false
  const success = fact.status === DELIVERED || fact.status === READ
  if (success) return fact.chatId !== null && fact.idMessage !== null
  return fact.status === FAILED || fact.status === NO_ACCOUNT
}
