// Independent expected protocol values; production code must not import this file.

export const TEST_API_RESPONSE = {
  OK: 'ok',
  ERROR: 'error',
} as const

export const TEST_API_CODE = {
  SERVICE_UNAVAILABLE: 'service_unavailable',
  SESSION_REQUIRED: 'session_required',
  INVALID_UPSTREAM_RESPONSE: 'invalid_upstream_response',
  RATE_LIMITED: 'rate_limited',
  INVALID_TOKEN: 'invalid_token',
  INVALID_INSTANCE: 'invalid_instance',
  INSTANCE_EXPIRED: 'instance_expired',
  CONNECTION_CHANGED: 'connection_changed',
  RETRY_LATER: 'retry_later',
  OUTCOME_UNKNOWN: 'outcome_unknown',
  NEEDS_AUTHORIZATION: 'needs_authorization',
  INSTANCE_RESTRICTED: 'instance_restricted',
} as const

export const TEST_NOTIFICATION_PROTOCOL = {
  RECEIVER_NOT_ACTIVE: 'receiver_not_active',
  SEND_IN_PROGRESS: 'send_in_progress',
  NOT_OWNER: 'not_owner',
  OWNERSHIP_BUSY: 'ownership_busy',
  DELETE_FAILED: 'delete_failed',
  CLAIM: 'claim',
  STREAM: 'stream',
  RELEASE: 'release',
  CLAIM_SUFFIX: '/claim',
  ACK_SUFFIX: '/ack',
  RELEASE_SUFFIX: '/release',
  IGNORED: 'ignored',
  INCOMING_KIND: 'incoming_message',
  STATUS_KIND: 'message_status',
  NOTIFICATION_EVENT: 'notification',
  PAUSED: 'paused',
  CLOSED: 'closed',
} as const

export const TEST_PROVIDER_PROTOCOL = {
  TELEGRAM: 'telegram',
  YES: 'yes',
  USER: 'user',
  GROUP: 'group',
  STATUS_WEBHOOK: 'outgoingMessageStatus',
  TEXT_MESSAGE: 'textMessage',
  EXTENDED_TEXT_MESSAGE: 'extendedTextMessage',
} as const

export const TEST_MESSAGE_PROTOCOL = {
  ACCEPTED: 'accepted',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
  NO_ACCOUNT: 'noAccount',
  INCOMING: 'incoming',
  OUTGOING: 'outgoing',
  TEXT: 'text',
  UNSUPPORTED: 'unsupported',
} as const

export const TEST_HTTP_PROTOCOL = {
  GET: 'GET',
  POST: 'POST',
  DELETE: 'DELETE',
  CONTENT_TYPE: 'Content-Type',
  JSON: 'application/json',
  SSE: 'text/event-stream',
  NO_STORE: 'no-store',
  CHAT_OWNER: 'X-Chat-Owner',
  ORIGIN: 'Origin',
} as const

export const TEST_API_ROUTES = {
  MESSAGES: '/api/messages',
  CHATS: '/api/chats',
} as const
