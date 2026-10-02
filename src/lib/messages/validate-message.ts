import type { MessageDTO } from './types'
import { isRecord } from '@/lib/api/is-record'
import { isChatId } from '@/lib/chats/validate-chat-id'
import { MESSAGE_DIRECTION, MESSAGE_KIND, MESSAGE_STATUS } from './constants'

const { INCOMING, OUTGOING } = MESSAGE_DIRECTION
const { TEXT, UNSUPPORTED } = MESSAGE_KIND
const statuses: readonly string[] = Object.values(MESSAGE_STATUS)
const isOptionalTime = (value: unknown) =>
  value === null ||
  (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0)

export const isMessageDTO = (value: unknown): value is MessageDTO => {
  if (!isRecord(value)) return false
  const validKind =
    (value.kind === TEXT && typeof value.text === 'string') ||
    (value.kind === UNSUPPORTED && value.text === null)
  const validStatus =
    value.status === null ||
    (value.direction === OUTGOING &&
      typeof value.status === 'string' &&
      statuses.includes(value.status))
  const valid =
    isChatId(value.chatId) &&
    isChatId(value.idMessage) &&
    (value.direction === INCOMING || value.direction === OUTGOING) &&
    validKind &&
    validStatus &&
    isOptionalTime(value.timestamp) &&
    isOptionalTime(value.acceptedAt)
  return valid
}
