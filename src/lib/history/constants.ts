export const HISTORY_CONFIG = {
  COUNT: 10,
  REQUEST_KEY: 'chat-history-request',
  QUERY_ERROR_NAME: 'HistoryQueryError',
  PROVIDER_REQUIRED: 'useChatHistory requires QueryProvider',
  REQUEST_CHAT_ID_FIELD: 'chatId',
  USER_CHAT: 'user',
  TEXT_MESSAGE: 'textMessage',
  INVALID_TARGET_PATTERN: /validation failed/i,
} as const

export const HISTORY_QUERY_STATE = {
  SUCCESS: 'success',
  ERROR: 'error',
} as const

export const HISTORY_ORIGIN_CONFIG = {
  ROOT_PATH: '/',
  INVALID_HOST_PARTS: /[\\/@?#\s]/u,
} as const
