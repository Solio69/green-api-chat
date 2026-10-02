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
  GC_TIME: Infinity,
  MILLISECONDS_PER_SECOND: 1_000,
  INVALID_FACTS: 'Invalid message facts',
} as const
