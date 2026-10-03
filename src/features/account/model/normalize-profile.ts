import type { AccountProfile } from './types'
import { isRecord } from '@/lib/api/is-record'
import { EMPTY_STRING } from '@/lib/ui/constants'
import { ACCOUNT_AVATAR_URL } from './constants'

const { PROTOCOL, ABSOLUTE_PREFIX } = ACCOUNT_AVATAR_URL

type CredentialsForFiltering = {
  idInstance: string
  apiTokenInstance: string
}

type NormalizeAccountProfileOptions = {
  value: unknown
  credentials: CredentialsForFiltering
}

const readText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : EMPTY_STRING

const containsCredentials = ({
  value,
  credentials,
}: {
  value: string
  credentials: CredentialsForFiltering
}): boolean => {
  let decoded = value
  try {
    decoded = decodeURIComponent(value)
  } catch {
    // Malformed escaping still gets checked against the raw value.
  }

  return Object.values(credentials).some((credential) => {
    const secret = credential.trim()

    return (
      Boolean(secret) &&
      (value.includes(secret) ||
        value.includes(encodeURIComponent(secret)) ||
        decoded.includes(secret))
    )
  })
}

const readDisplayText = ({
  value,
  credentials,
}: {
  value: unknown
  credentials: CredentialsForFiltering
}): string => {
  const text = readText(value)
  if (containsCredentials({ value: text, credentials })) return EMPTY_STRING

  return text
}

const readAvatarUrl = (value: string): string => {
  if (!value.toLowerCase().startsWith(ABSOLUTE_PREFIX)) return EMPTY_STRING
  try {
    const url = new URL(value)
    const isSafeSource =
      url.protocol === PROTOCOL && !url.username && !url.password

    return isSafeSource ? value : EMPTY_STRING
  } catch {
    return EMPTY_STRING
  }
}

export const normalizeAccountProfile = ({
  value,
  credentials,
}: NormalizeAccountProfileOptions): AccountProfile => {
  if (!isRecord(value)) return { label: EMPTY_STRING, avatarUrl: EMPTY_STRING }
  const fields = value
  const username = readDisplayText({ value: fields.username, credentials })
  const phone = readDisplayText({ value: fields.phone, credentials })
  const avatar = readDisplayText({ value: fields.avatar, credentials })

  return { label: username || phone, avatarUrl: readAvatarUrl(avatar) }
}
