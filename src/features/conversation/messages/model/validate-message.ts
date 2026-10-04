import { isChatId } from '@/features/chats/model'
import type { MessageDTO } from '@/features/conversation/messages/model/types'
import { isRecord } from '@/shared/kernel/api/is-record'
import {
  MESSAGE_DIRECTION,
  MESSAGE_KIND,
  MESSAGE_STATUS,
} from '@/features/conversation/messages/model/constants'

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
