export const CHAT_SCOPE_CONFIG = {
  PATTERN: /^[A-Za-z0-9_-]{43}$/,
  DOMAIN: 'chat-query-v1',
  ALGORITHM: 'sha256',
  ENCODING: 'base64url',
} as const
export const SESSION_CHAT_SOURCE = {
  ACCEPTED: 'accepted',
  INCOMING: 'incoming',
} as const
