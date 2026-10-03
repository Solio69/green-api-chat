import type { SendRequest } from './types'
import { isPersonalChatId } from '@/features/chats/model'
import { isRecord } from '@/lib/api/is-record'
import type { InstanceCredentials } from '@/lib/green-api/get-state'
import { isSafeIdentifier } from '@/lib/green-api/safe-identifier'
import { SEND_CONFIG } from './constants'

const { REQUEST_FIELDS, ATTEMPT_ID_PATTERN, MAX_CODE_POINTS } = SEND_CONFIG

export const validateSendRequest = ({
  value,
  credentials,
}: {
  value: unknown
  credentials: InstanceCredentials
}): SendRequest | null => {
  if (!isRecord(value)) return null
  const validFields =
    Object.keys(value).length === REQUEST_FIELDS.length &&
    REQUEST_FIELDS.every((field) => Object.hasOwn(value, field))
  if (!validFields) return null
  const { chatId, message, attemptId } = value
  if (!isPersonalChatId(chatId)) return null
  if (!isSafeIdentifier({ value: chatId, secrets: Object.values(credentials) }))
    return null
  const validText =
    typeof message === 'string' &&
    message.trim().length > 0 &&
    Array.from(message).length <= MAX_CODE_POINTS
  if (!validText) return null
  const validAttempt =
    typeof attemptId === 'string' &&
    attemptId === attemptId.trim() &&
    ATTEMPT_ID_PATTERN.test(attemptId)
  if (!validAttempt) return null
  return { chatId, message, attemptId }
}
