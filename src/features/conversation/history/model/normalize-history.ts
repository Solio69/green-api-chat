import { isChatId, isPersonalChatId } from '@/features/chats/model'
import { mergeMessageFacts } from '@/features/conversation/messages/model/merge-message-facts'
import type { MessageDTO } from '@/features/conversation/messages/model/types'
import { isRecord } from '@/shared/kernel/api/is-record'
import {
  MESSAGE_DIRECTION,
  MESSAGE_KIND,
  MESSAGE_STATUS,
} from '@/features/conversation/messages/model/constants'
import { HISTORY_MODEL_CONFIG } from './constants'

type CredentialsForFiltering = { idInstance: string; apiTokenInstance: string }

const { USER_CHAT, TEXT_MESSAGE } = HISTORY_MODEL_CONFIG
const { INCOMING, OUTGOING } = MESSAGE_DIRECTION
const { TEXT, UNSUPPORTED } = MESSAGE_KIND
const { DELIVERED, READ } = MESSAGE_STATUS

export const normalizeHistory = ({
  value,
  chatId,
  credentials,
}: {
  value: unknown
  chatId: string
  credentials?: CredentialsForFiltering
}): MessageDTO[] | null => {
  if (!Array.isArray(value)) return null
  if (!isPersonalChatId(chatId)) return null
  const secrets = credentials
    ? Object.values(credentials).flatMap((secret) => [
        secret,
        encodeURIComponent(secret),
      ])
    : []
  const messages: MessageDTO[] = []
  for (const item of value) {
    if (!isRecord(item)) return null
    const {
      idMessage,
      type,
      timestamp,
      typeMessage,
      textMessage,
      statusMessage,
    } = item
    if (!isChatId(idMessage)) return null
    if (typeof timestamp !== 'number') return null
    const validIdentity =
      item.chatId === chatId &&
      item.chatType === USER_CHAT &&
      !secrets.some((secret) => idMessage.includes(secret)) &&
      (type === INCOMING || type === OUTGOING) &&
      Number.isSafeInteger(timestamp) &&
      timestamp >= 0 &&
      typeof typeMessage === 'string' &&
      typeMessage.trim().length > 0
    if (!validIdentity) return null
    const isText = typeMessage === TEXT_MESSAGE
    let text: string | null = null
    if (isText) {
      if (typeof textMessage !== 'string') return null
      text = textMessage
    }
    let status: MessageDTO['status'] = null
    const confirmedStatus =
      type === OUTGOING &&
      (statusMessage === DELIVERED || statusMessage === READ)
    if (confirmedStatus) status = statusMessage
    messages.push({
      chatId,
      idMessage,
      direction: type,
      kind: isText ? TEXT : UNSUPPORTED,
      text,
      timestamp,
      acceptedAt: null,
      status,
    })
  }
  return mergeMessageFacts({ current: [], messages }).messages
}
