import { SEND_CONFIG } from '@/lib/sending/constants'

const { INVALID_IDENTIFIER_PATTERN } = SEND_CONFIG

export const isSafeIdentifier = ({
  value,
  secrets,
}: {
  value: unknown
  secrets: readonly string[]
}): boolean => {
  const validShape =
    typeof value === 'string' &&
    value.length > 0 &&
    value === value.trim() &&
    !INVALID_IDENTIFIER_PATTERN.test(value)
  if (!validShape) return false
  const containsSecret = secrets.some((secret) => {
    if (secret.length === 0) return false
    return value.includes(secret) || value.includes(encodeURIComponent(secret))
  })
  return !containsSecret
}
