export const AUTH_CONFIG = {
  SESSION_DURATION_SECONDS: 86_400,
  COOKIE_NAME: 'green-api-chat-session',
  COOKIE_SAME_SITE: 'lax',
  COOKIE_PATH: '/',
  PASSWORD_MIN_LENGTH: 32,
  PRODUCTION_NODE_ENV: 'production',
} as const

export const IS_PRODUCTION =
  process.env.NODE_ENV === AUTH_CONFIG.PRODUCTION_NODE_ENV

export const AUTH_ERROR_MESSAGE = {
  SESSION_UNAVAILABLE: 'Session unavailable',
} as const
