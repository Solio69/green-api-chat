import { isPersonalChatId } from '@/features/chats/model'
import { isRecord } from '@/lib/api/is-record'
import { HISTORY_MODEL_CONFIG } from './constants'

const { REQUEST_CHAT_ID_FIELD } = HISTORY_MODEL_CONFIG

export const validateHistoryRequest = (
  value: unknown,
): { chatId: string } | null => {
  if (!isRecord(value)) return null
  const expectedShape =
    Object.keys(value).length === 1 &&
    Object.hasOwn(value, REQUEST_CHAT_ID_FIELD)
  if (!expectedShape) return null
  if (!isPersonalChatId(value.chatId)) return null
  return { chatId: value.chatId }
}
