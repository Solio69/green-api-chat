export const NOTIFICATION_CONFIG = {
  BACKOFF_JITTER_MIN: 0.8,
  BACKOFF_JITTER_RANGE: 0.2,
  TIMEOUT_MS: 8_000,
  RECEIVE_TIMEOUT_SECONDS: 5,
  CHAT_REFRESH_MS: 1_000,
  BACKOFF_MS: [1_000, 2_000, 4_000, 8_000, 10_000],
  OUTGOING_DISABLED: 'outgoing_notifications_disabled',
  IGNORED_REASON: 'out_of_scope',
  UNSUPPORTED_REASON: 'unsupported_event',
} as const

export const NOTIFICATION_CODE = {
  OWNERSHIP_BUSY: 'ownership_busy',
  DELIVERY_CHANGED: 'delivery_changed',
  NOT_CONFIGURED: 'notifications_not_configured',
  INVALID_UPSTREAM: 'invalid_upstream_response',
  RETRY_LATER: 'retry_later',
} as const

export const NOTIFICATION_KIND = {
  INCOMING: 'incoming_message',
  STATUS: 'message_status',
  IGNORED: 'ignored',
} as const

export const NOTIFICATION_STATE = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RETRYING: 'retrying',
  LIMITED: 'limited',
  PAUSED: 'paused',
  CLOSED: 'closed',
} as const

export const PROVIDER_NOTIFICATION = {
  TELEGRAM: 'telegram',
  YES: 'yes',
  NO: 'no',
  INCOMING: 'incomingMessageReceived',
  STATUS: 'outgoingMessageStatus',
  USER: 'user',
  OTHER_CHAT_TYPES: ['group', 'supergroup', 'channel', 'bot'],
  TEXT: 'textMessage',
  EXTENDED_TEXT: 'extendedTextMessage',
  MEDIA: [
    'imageMessage',
    'videoMessage',
    'documentMessage',
    'audioMessage',
    'locationMessage',
    'contactMessage',
    'pollMessage',
    'stickerMessage',
  ],
} as const

export const NOTIFICATION_ROUTES = {
  SETTINGS: '/api/notifications/settings',
  RECEIVE: '/api/notifications/receive',
  ACK: '/api/notifications/ack',
} as const

export const NOTIFICATION_ACTION = {
  SETTINGS: 'settings',
  RECEIVE: 'receive',
  ACK: 'ack',
} as const

export const POLLING_CONFIG = {
  ACK_PURPOSE: 'notification-ack-v1',
  SIGNATURE_ALGORITHM: 'sha256',
  TOKEN_ENCODING: 'base64url',
  TOKEN_SEPARATOR: '.',
  ACK_TTL_MS: 300_000,
  MAX_TOKEN_LENGTH: 1_024,
  CLIENT_TIMEOUT_MS: 25_000,
  REQUEST_SPACING_MS: 100,
  LOCK_PREFIX: 'green-api-chat.notifications:',
  LOCK_UNAVAILABLE: 'browser_lock_unavailable',
} as const
