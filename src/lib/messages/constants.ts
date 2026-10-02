export const MESSAGE_DIRECTION = {
  INCOMING: 'incoming',
  OUTGOING: 'outgoing',
} as const
export const MESSAGE_KIND = {
  TEXT: 'text',
  UNSUPPORTED: 'unsupported',
} as const
export const MESSAGE_STATUS = {
  ACCEPTED: 'accepted',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
  NO_ACCOUNT: 'noAccount',
} as const
export const MESSAGE_CACHE_CONFIG = {
  KEY: 'messages',
  STATUS_FACTS_KEY: 'message-status-facts',
  ISSUES_KEY: 'message-status-issues',
  EARLY_FACT_TTL_MS: 300_000,
  EARLY_FACT_LIMIT: 1_000,
  GC_TIME: Infinity,
  MILLISECONDS_PER_SECOND: 1_000,
  INVALID_FACTS: 'Invalid message facts',
  PROVIDER_REQUIRED: 'Messages require QueryProvider',
} as const

export const MESSAGE_SOURCE = {
  HISTORY: 'history',
  LIVE: 'live',
  ACCEPTED: 'accepted',
} as const
