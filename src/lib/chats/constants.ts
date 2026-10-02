export const CHAT_QUERY_CONFIG = {
  KEY: 'chats',
  STALE_TIME_MS: 60_000,
  GC_TIME_MS: 300_000,
  SCOPE_PATTERN: /^[A-Za-z0-9_-]{43}$/,
  SCOPE_DOMAIN: 'chat-query-v1',
  SCOPE_ALGORITHM: 'sha256',
  SCOPE_ENCODING: 'base64url',
  PROVIDER_REQUIRED: 'useChats requires QueryProvider',
  QUERY_ERROR_NAME: 'ChatsQueryError',
} as const
export const SESSION_CHAT_CONFIG = {
  KEY: 'session-chats',
  INVALID_FACTS: 'Invalid session chat facts',
} as const
export const SESSION_CHAT_SOURCE = {
  ACCEPTED: 'accepted',
  INCOMING: 'incoming',
} as const
