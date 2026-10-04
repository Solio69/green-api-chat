export const CHAT_QUERY_CONFIG = {
  KEY: 'chats',
  STALE_TIME_MS: 60_000,
  GC_TIME_MS: 300_000,
  PROVIDER_REQUIRED: 'useChats requires QueryProvider',
  QUERY_ERROR_NAME: 'ChatsQueryError',
} as const
export const SESSION_CHAT_CONFIG = {
  KEY: 'session-chats',
  INVALID_FACTS: 'Invalid session chat facts',
} as const
