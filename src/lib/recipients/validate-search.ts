import {
  RECIPIENT_REQUEST_KEYS,
  RECIPIENT_SEARCH_MODE,
  RECIPIENT_VALIDATION,
} from './constants'

const { MODE, VALUE } = RECIPIENT_REQUEST_KEYS
const { PHONE, USERNAME } = RECIPIENT_SEARCH_MODE
const {
  MAX_PHONE_DIGITS,
  MAX_USERNAME_LENGTH,
  PHONE_PATTERN,
  USERNAME_PATTERN,
  USERNAME_PREFIX,
} = RECIPIENT_VALIDATION

export type RecipientQuery = { phoneNumber: number } | { username: string }

export const parseSearchRequest = (value: unknown): RecipientQuery | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const input = record[VALUE]
  if (
    !Object.hasOwn(record, MODE) ||
    !Object.hasOwn(record, VALUE) ||
    Object.keys(record).some((key) => key !== MODE && key !== VALUE) ||
    typeof input !== 'string'
  )
    return null

  if (record[MODE] === PHONE) {
    if (input.length > MAX_PHONE_DIGITS || !PHONE_PATTERN.test(input))
      return null
    return { phoneNumber: Number(input) }
  }
  if (record[MODE] === USERNAME) {
    const name = input.startsWith(USERNAME_PREFIX) ? input.slice(1) : input
    if (
      name.length === 0 ||
      name.length > MAX_USERNAME_LENGTH ||
      !USERNAME_PATTERN.test(name)
    )
      return null
    return { username: `${USERNAME_PREFIX}${name}` }
  }
  return null
}
