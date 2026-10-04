import type { PersonalChat } from './types'
import { isRecord } from '@/shared/kernel/api/is-record'

type CredentialsForFiltering = { idInstance: string; apiTokenInstance: string }

export const normalizeChats = ({
  value,
  credentials,
}: {
  value: unknown
  credentials: CredentialsForFiltering
}): PersonalChat[] | null => {
  if (!Array.isArray(value)) return null
  const secrets = Object.values(credentials).flatMap((secret) => [
    secret,
    encodeURIComponent(secret),
  ])
  const safeText = (text: unknown): string | null => {
    if (typeof text !== 'string') return null
    const trimmed = text.trim()
    const isUnsafe =
      !trimmed || secrets.some((secret) => trimmed.includes(secret))
    return isUnsafe ? null : trimmed
  }
  const chats: PersonalChat[] = []
  const seen = new Set<string>()
  for (const item of value) {
    if (!isRecord(item)) return null
    const isValidType =
      typeof item.type === 'string' && item.type.trim().length > 0
    if (!isValidType) return null
    if (item.type !== 'user') continue
    const chatId = safeText(item.chatId)
    if (!chatId) return null
    if (seen.has(chatId)) continue
    seen.add(chatId)
    const number = item.phoneNumber
    const isVisiblePhone =
      typeof number === 'number' && Number.isSafeInteger(number) && number > 0
    chats.push({
      chatId,
      name: safeText(item.name),
      username: safeText(item.username),
      phone: isVisiblePhone ? safeText(String(number)) : null,
    })
  }
  return chats
}
