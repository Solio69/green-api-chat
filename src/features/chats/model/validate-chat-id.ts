const INVALID_CHAT_ID = /[\u0000-\u001f\u007f]/u
const GROUP_PREFIX = '-'
const WHATSAPP_SUFFIXES = ['@c.us', '@g.us'] as const

export const isChatId = (value: unknown): value is string => {
  const valid =
    typeof value === 'string' &&
    value.length > 0 &&
    value === value.trim() &&
    !INVALID_CHAT_ID.test(value)
  return valid
}
export const isPersonalChatId = (value: unknown): value is string => {
  if (!isChatId(value)) return false
  const personal =
    !value.startsWith(GROUP_PREFIX) &&
    !WHATSAPP_SUFFIXES.some((suffix) => value.endsWith(suffix))
  return personal
}
