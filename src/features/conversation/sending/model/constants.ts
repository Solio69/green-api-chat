export const SEND_CONFIG = {
  NETWORK_MODE: 'always',
  MAX_CODE_POINTS: 4096,
  MAX_BODY_BYTES: 65_536,
  REQUEST_FIELDS: ['chatId', 'message', 'attemptId'],
  ATTEMPT_ID_PATTERN:
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
} as const

export const SEND_OUTCOME = {
  NOT_SENT: 'not_sent',
  UNKNOWN: 'unknown',
} as const

export const SEND_RESULT_KIND = {
  ACCEPTED: 'accepted',
  ERROR: 'error',
} as const
