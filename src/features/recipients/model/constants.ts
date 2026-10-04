export const RECIPIENT_SEARCH_MODE = {
  PHONE: 'phone',
  USERNAME: 'username',
} as const

export const RECIPIENT_RESULT_KIND = {
  FOUND: 'found',
  NOT_FOUND: 'not_found',
} as const

export const RECIPIENT_REQUEST_KEYS = {
  MODE: 'mode',
  VALUE: 'value',
} as const

export const RECIPIENT_VALIDATION = {
  MAX_PHONE_DIGITS: 15,
  MAX_USERNAME_LENGTH: 32,
  PHONE_PATTERN: /^[1-9]\d*$/,
  USERNAME_PATTERN: /^[A-Za-z0-9_]+$/,
  USERNAME_PREFIX: '@',
} as const
