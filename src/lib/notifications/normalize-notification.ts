import { normalizeMessageStatus } from './normalize-message-status'
import type { NormalizedNotification } from './types'
import { isChatId, isPersonalChatId } from '@/features/chats/model'
import { isRecord } from '@/lib/api/is-record'
import type { InstanceCredentials } from '@/lib/green-api/get-state'
import { isSafeIdentifier } from '@/lib/green-api/safe-identifier'
import { MESSAGE_DIRECTION, MESSAGE_KIND } from '@/lib/messages/constants'
import {
  NOTIFICATION_CONFIG,
  NOTIFICATION_KIND,
  PROVIDER_NOTIFICATION,
} from './constants'

const { IGNORED_REASON } = NOTIFICATION_CONFIG
const {
  STATUS: PROVIDER_STATUS,
  INCOMING: PROVIDER_INCOMING,
  OTHER_CHAT_TYPES,
} = PROVIDER_NOTIFICATION
const { UNSUPPORTED, TEXT: MESSAGE_TEXT } = MESSAGE_KIND
const { INCOMING: DIRECTION_INCOMING } = MESSAGE_DIRECTION

export type NormalizedReceipt = {
  receiptId: number
  event: NormalizedNotification
}
const { INCOMING, STATUS, IGNORED } = NOTIFICATION_KIND
const { TELEGRAM, USER, TEXT, EXTENDED_TEXT, MEDIA } = PROVIDER_NOTIFICATION
const ignored: NormalizedNotification = {
  kind: IGNORED,
  reason: IGNORED_REASON,
}
const hasSecret = ({ value, secrets }: { value: string; secrets: string[] }) =>
  secrets.some(
    (secret) =>
      value.includes(secret) || value.includes(encodeURIComponent(secret)),
  )
export const normalizeNotification = ({
  value,
  credentials,
}: {
  value: unknown
  credentials: InstanceCredentials
}): NormalizedReceipt | null => {
  if (!isRecord(value)) return null
  const validReceipt =
    typeof value.receiptId === 'number' &&
    Number.isSafeInteger(value.receiptId) &&
    value.receiptId > 0
  if (!validReceipt) return null
  const body = value.body
  if (!isRecord(body)) return null
  const instance = body.instanceData
  if (!isRecord(instance)) return null
  const numericInstance =
    typeof instance.idInstance === 'number' &&
    Number.isSafeInteger(instance.idInstance)
  const instanceId = numericInstance
    ? String(instance.idInstance)
    : instance.idInstance
  const validEnvelope =
    instanceId === credentials.idInstance &&
    instance.typeInstance === TELEGRAM &&
    isChatId(body.typeWebhook)
  if (!validEnvelope) return null
  const receiptId = value.receiptId as number
  if (body.typeWebhook === PROVIDER_STATUS) {
    const fact = normalizeMessageStatus({ value: body, credentials })
    if (fact === null) return null
    return {
      receiptId,
      event: fact === 'ignored' ? ignored : { kind: STATUS, fact },
    }
  }
  if (body.typeWebhook !== PROVIDER_INCOMING)
    return { receiptId, event: ignored }
  const sender = body.senderData
  if (!isRecord(sender)) return null
  if (!isChatId(sender.chatId)) return null
  if (!isPersonalChatId(sender.chatId)) return { receiptId, event: ignored }
  const outsidePersonalChat = OTHER_CHAT_TYPES.some(
    (type) => type === sender.chatType,
  )
  if (outsidePersonalChat) return { receiptId, event: ignored }
  if (sender.chatType !== USER) return null
  const secrets = Object.values(credentials)
  const validIdentity =
    isChatId(body.idMessage) &&
    isSafeIdentifier({ value: body.idMessage, secrets }) &&
    isSafeIdentifier({ value: sender.chatId, secrets }) &&
    typeof body.timestamp === 'number' &&
    Number.isSafeInteger(body.timestamp) &&
    body.timestamp >= 0
  if (!validIdentity) return null
  const data = body.messageData
  if (!isRecord(data)) return null
  if (!isChatId(data.typeMessage)) return null
  const update =
    body.isEdited === true ||
    body.isDeleted === true ||
    data.isEdited === true ||
    data.isDeleted === true ||
    Object.hasOwn(data, 'editedMessageData') ||
    Object.hasOwn(data, 'deletedMessageData')
  if (update) return { receiptId, event: ignored }
  let text: string | null = null
  let kind: 'text' | 'unsupported' = UNSUPPORTED
  if (data.typeMessage === TEXT) {
    if (!isRecord(data.textMessageData)) return null
    if (typeof data.textMessageData.textMessage !== 'string') return null
    text = data.textMessageData.textMessage
    kind = MESSAGE_TEXT
  } else if (data.typeMessage === EXTENDED_TEXT) {
    if (!isRecord(data.extendedTextMessageData)) return null
    if (typeof data.extendedTextMessageData.text !== 'string') return null
    text = data.extendedTextMessageData.text
    kind = MESSAGE_TEXT
  } else if (!MEDIA.some((type) => type === data.typeMessage))
    return { receiptId, event: ignored }
  const secretText = text !== null && hasSecret({ value: text, secrets })
  if (secretText) return null
  const displayLabel =
    [sender.senderContactName, sender.chatName, sender.senderName].find(
      (label): label is string =>
        typeof label === 'string' &&
        label.trim().length > 0 &&
        !hasSecret({ value: label, secrets }),
    ) ?? null
  const chatId = sender.chatId
  return {
    receiptId,
    event: {
      kind: INCOMING,
      chatId,
      displayLabel,
      message: {
        chatId,
        idMessage: body.idMessage as string,
        direction: DIRECTION_INCOMING,
        kind,
        text,
        timestamp: body.timestamp as number,
        acceptedAt: null,
        status: null,
      },
    },
  }
}
