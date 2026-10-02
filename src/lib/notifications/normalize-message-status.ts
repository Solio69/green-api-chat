import type { ProviderStatusFact } from './types'
import { isRecord } from '@/lib/api/is-record'
import { isChatId, isPersonalChatId } from '@/lib/chats/validate-chat-id'
import type { InstanceCredentials } from '@/lib/green-api/get-state'
import { isSafeIdentifier } from '@/lib/green-api/safe-identifier'
import { MESSAGE_STATUS } from '@/lib/messages/constants'

const { DELIVERED, READ, FAILED, NO_ACCOUNT } = MESSAGE_STATUS
export const normalizeMessageStatus = ({
  value,
  credentials,
}: {
  value: unknown
  credentials: InstanceCredentials
}): ProviderStatusFact | 'ignored' | null => {
  if (!isRecord(value)) return null
  if (typeof value.status !== 'string') return null
  const known =
    value.status === DELIVERED ||
    value.status === READ ||
    value.status === FAILED ||
    value.status === NO_ACCOUNT
  if (!known) return 'ignored'
  const secrets = Object.values(credentials)
  const hasChat = value.chatId !== undefined && value.chatId !== null
  const hasId = value.idMessage !== undefined && value.idMessage !== null
  const validChat =
    !hasChat ||
    (isChatId(value.chatId) &&
      isSafeIdentifier({ value: value.chatId, secrets }))
  const validId =
    !hasId ||
    (isChatId(value.idMessage) &&
      isSafeIdentifier({ value: value.idMessage, secrets }))
  if (!validChat) return null
  if (!validId) return null
  const outsidePersonalChat = hasChat && !isPersonalChatId(value.chatId)
  if (outsidePersonalChat) return 'ignored'
  const isFailure = value.status === FAILED || value.status === NO_ACCOUNT
  const missingIdentity = !hasChat || !hasId
  const unverifiableSuccess = !isFailure && missingIdentity
  if (unverifiableSuccess) return null
  const validTimestamp =
    value.timestamp === undefined ||
    value.timestamp === null ||
    (typeof value.timestamp === 'number' &&
      Number.isSafeInteger(value.timestamp) &&
      value.timestamp >= 0)
  if (!validTimestamp) return null
  return {
    chatId: hasChat ? (value.chatId as string) : null,
    idMessage: hasId ? (value.idMessage as string) : null,
    status: value.status as ProviderStatusFact['status'],
    timestamp: typeof value.timestamp === 'number' ? value.timestamp : null,
  }
}
