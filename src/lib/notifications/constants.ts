export const NOTIFICATION_CONFIG = {
  REGISTRY_KEY: 'green-api-chat.receiver.v1',
  IDENTIFIER_BYTES: 32,
  IDENTIFIER_ENCODING: 'base64url',
  BACKOFF_JITTER_MIN: 0.8,
  BACKOFF_JITTER_RANGE: 0.2,
  GRACE_MS: 10_000,
  CLAIM_MS: 10_000,
  TIMEOUT_MS: 8_000,
  RECEIVE_TIMEOUT_SECONDS: 5,
  REQUEST_SPACING_MS: 20,
  MAX_DELETE_ATTEMPTS: 3,
  HEARTBEAT_MS: 10_000,
  STALL_MS: 30_000,
  MAX_FRAME_BYTES: 131_072,
  CHAT_REFRESH_MS: 1_000,
  BACKOFF_MS: [1_000, 2_000, 4_000, 8_000, 10_000],
  OWNER_HEADER: 'X-Chat-Owner',
  CAPABILITY_PATTERN: /^[A-Za-z0-9_-]{43}$/,
  SSE_CONTENT_TYPE: 'text/event-stream; charset=utf-8',
  SSE_CACHE_CONTROL: 'no-cache, no-transform',
  BUFFERING_HEADER: 'X-Accel-Buffering',
  BUFFERING_DISABLED: 'no',
  STREAM_ERROR: 'Notification transport failed',
  OUTGOING_DISABLED: 'outgoing_notifications_disabled',
  IGNORED_REASON: 'out_of_scope',
  UNSUPPORTED_REASON: 'unsupported_event',
  SSE_BASE_CONTENT_TYPE: 'text/event-stream',
  SSE_DEFAULT_EVENT: 'message',
  SSE_EVENT_PREFIX: 'event:',
  SSE_DATA_PREFIX: 'data:',
  SSE_LINE_BREAK: '\n',
} as const

export const NOTIFICATION_CODE = {
  OWNERSHIP_BUSY: 'ownership_busy',
  NOT_OWNER: 'not_owner',
  RECEIVER_NOT_ACTIVE: 'receiver_not_active',
  SEND_IN_PROGRESS: 'send_in_progress',
  STREAM_ALREADY_OPEN: 'stream_already_open',
  DELIVERY_CHANGED: 'delivery_changed',
  NOT_CONFIGURED: 'notifications_not_configured',
  INVALID_UPSTREAM: 'invalid_upstream_response',
  DELETE_FAILED: 'delete_failed',
  RETRY_LATER: 'retry_later',
} as const

export const NOTIFICATION_EVENT = {
  READY: 'ready',
  NOTIFICATION: 'notification',
  STATE: 'receiver_state',
  HEARTBEAT: 'heartbeat',
  ERROR: 'connection_error',
} as const

export const NOTIFICATION_KIND = {
  INCOMING: 'incoming_message',
  STATUS: 'message_status',
  IGNORED: 'ignored',
} as const

export const NOTIFICATION_STATE = {
  CLAIMING: 'claiming',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RETRYING: 'retrying',
  LIMITED: 'limited',
  PAUSED: 'paused',
  CLOSED: 'closed',
  RECEIVING: 'receiving',
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
  CLAIM: '/api/notifications/claim',
  STREAM: '/api/notifications/stream',
  ACK: '/api/notifications/ack',
  RELEASE: '/api/notifications/release',
} as const

export const NOTIFICATION_ACTION = {
  CLAIM: 'claim',
  STREAM: 'stream',
  ACK: 'ack',
  RELEASE: 'release',
} as const
