export const AUTH_QUERY = {
  REASON: 'reason',
  ACCESS_LOST: 'access_lost',
} as const

export const HOME_RESULT_KIND = {
  LOGIN: 'login',
  END_SESSION: 'end-session',
  RETRY: 'retry',
} as const
