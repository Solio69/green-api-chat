import { isPersonalChatId } from '@/features/chats/model'
import type { SendRequest } from '@/features/conversation/sending/model/types'
import type { InstanceCredentials } from '@/shared/kernel/api/instance-credentials'
import { isRecord } from '@/shared/kernel/api/is-record'
import { isSafeIdentifier } from '@/shared/kernel/api/safe-identifier'
import { SEND_CONFIG } from '@/features/conversation/sending/model/constants'

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
