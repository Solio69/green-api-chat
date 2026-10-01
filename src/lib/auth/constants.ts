export const AUTH_CONFIG = {
  MAX_REQUEST_BYTES: 8_192,
  SESSION_DURATION_SECONDS: 86_400,
  COOKIE_NAME: 'green-api-chat-session',
  COOKIE_SAME_SITE: 'lax',
  COOKIE_PATH: '/',
  PASSWORD_MIN_LENGTH: 32,
  PRODUCTION_NODE_ENV: 'production',
} as const

export const IS_PRODUCTION =
  process.env.NODE_ENV === AUTH_CONFIG.PRODUCTION_NODE_ENV

export const AUTH_QUERY = {
  REASON: 'reason',
  ACCESS_LOST: 'access_lost',
} as const

export const AUTH_ERROR_MESSAGE = {
  SESSION_UNAVAILABLE: 'Session unavailable',
} as const

export const HOME_RESULT_KIND = {
  LOGIN: 'login',
  END_SESSION: 'end-session',
  RETRY: 'retry',
} as const
