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
  const status = value.status
  if (typeof status !== 'string') return null
  const known =
    status === DELIVERED ||
    status === READ ||
    status === FAILED ||
    status === NO_ACCOUNT
  if (!known) return 'ignored'
  const secrets = Object.values(credentials)
  const rawChatId = value.chatId
  let chatId: string | null = null
  if (rawChatId !== undefined && rawChatId !== null) {
    const valid =
      isChatId(rawChatId) && isSafeIdentifier({ value: rawChatId, secrets })
    if (!valid) return null
    chatId = rawChatId
  }
  const rawMessageId = value.idMessage
  let idMessage: string | null = null
  if (rawMessageId !== undefined && rawMessageId !== null) {
    const valid =
      isChatId(rawMessageId) &&
      isSafeIdentifier({ value: rawMessageId, secrets })
    if (!valid) return null
    idMessage = rawMessageId
  }
  if (chatId !== null && !isPersonalChatId(chatId)) return 'ignored'
  const isFailure = status === FAILED || status === NO_ACCOUNT
  const missingIdentity = chatId === null || idMessage === null
  if (!isFailure && missingIdentity) return null
  const validTimestamp =
    value.timestamp === undefined ||
    value.timestamp === null ||
    (typeof value.timestamp === 'number' &&
      Number.isSafeInteger(value.timestamp) &&
      value.timestamp >= 0)
  if (!validTimestamp) return null
  return {
    chatId,
    idMessage,
    status,
    timestamp: typeof value.timestamp === 'number' ? value.timestamp : null,
  }
}
