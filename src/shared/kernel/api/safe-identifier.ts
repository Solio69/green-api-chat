const INVALID_IDENTIFIER_PATTERN = /[\u0000-\u001f\u007f]/u

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
