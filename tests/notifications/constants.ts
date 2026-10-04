export const NOTIFICATION_TEST = {
  CREDENTIALS: {
    idInstance: '4100000001',
    apiTokenInstance: 'fictional-notification-token',
  },
  CHAT: '10000001',
  MESSAGE: 'notification-message-1',
  RECEIPT: 11,
  SCOPE: 'notification-scope',
  EPOCH: 'notification-epoch',
  TEXT: '  Привет\n🙂  ',
  LABEL: 'Василиса',
  TIMESTAMP: 1_800_000_000,
} as const

export const NOTIFICATION_CONNECTION_TEST = {
  CLOSED: 'closed',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RETRYING: 'retrying',
  LIMITED: 'limited',
  PAUSED: 'paused',
  OWNERSHIP_BUSY: 'ownership_busy',
  LOCK_UNAVAILABLE: 'browser_lock_unavailable',
  INVALID_UPSTREAM: 'invalid_upstream_response',
  NOT_CONFIGURED: 'notifications_not_configured',
  OUTGOING_DISABLED: 'outgoing_notifications_disabled',
  RETRY_LATER: 'retry_later',
} as const

const { CREDENTIALS, CHAT, MESSAGE, RECEIPT, TEXT, LABEL, TIMESTAMP } =
  NOTIFICATION_TEST
export const envelope = (patch: Record<string, unknown> = {}) => ({
  receiptId: RECEIPT,
  body: {
    typeWebhook: 'incomingMessageReceived',
    instanceData: {
      idInstance: CREDENTIALS.idInstance,
      typeInstance: 'telegram',
    },
    timestamp: TIMESTAMP,
    idMessage: MESSAGE,
    senderData: { chatId: CHAT, chatType: 'user', senderContactName: LABEL },
    messageData: {
      typeMessage: 'textMessage',
      textMessageData: { textMessage: TEXT },
    },
    ...patch,
  },
})
