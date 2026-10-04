import type { PersonalChat } from '@/features/chats/model'
import { isPersonalChatId, SESSION_CHAT_SOURCE } from '@/features/chats/model'
import type { QuerySession } from '@/shared/query/create-query-session'
import { SESSION_CHAT_CONFIG } from './constants'

const { KEY, INVALID_FACTS } = SESSION_CHAT_CONFIG
export type SessionChatCache = {
  factsByChatId: Readonly<Record<string, PersonalChat>>
  labelsByChatId: Readonly<Record<string, string>>
}
export const sessionChatKey = (connectionScope: string) =>
  [KEY, connectionScope] as const
const emptyCache = (): SessionChatCache => ({
  factsByChatId: {},
  labelsByChatId: {},
})
const isNullableText = (value: unknown) =>
  value === null || typeof value === 'string'
export const rememberPersonalChat = ({
  session,
  chatId,
  label,
  source,
  profile,
}: {
  session: QuerySession
  chatId: string
  label: string | null
  source: (typeof SESSION_CHAT_SOURCE)[keyof typeof SESSION_CHAT_SOURCE]
  profile?: PersonalChat
}): void => {
  if (!session.isActive()) return
  const validProfile =
    profile === undefined ||
    (profile.chatId === chatId &&
      isNullableText(profile.name) &&
      isNullableText(profile.username) &&
      isNullableText(profile.phone))
  const validLabel =
    label === null || (typeof label === 'string' && label.trim().length > 0)
  const valid =
    isPersonalChatId(chatId) &&
    Object.values(SESSION_CHAT_SOURCE).includes(source) &&
    validProfile &&
    validLabel
  if (!valid) throw new Error(INVALID_FACTS)
  session.client.setQueryData<SessionChatCache>(
    sessionChatKey(session.connectionScope),
    (current = emptyCache()) => {
      const previous = Object.hasOwn(current.factsByChatId, chatId)
        ? current.factsByChatId[chatId]
        : undefined
      const fact = {
        chatId,
        name: previous?.name ?? profile?.name ?? null,
        username: previous?.username ?? profile?.username ?? null,
        phone: previous?.phone ?? profile?.phone ?? null,
      }
      const facts = new Map(Object.entries(current.factsByChatId))
      const labels = new Map(Object.entries(current.labelsByChatId))
      facts.set(chatId, fact)
      if (label !== null) labels.set(chatId, label)
      return {
        factsByChatId: Object.fromEntries(facts),
        labelsByChatId: Object.fromEntries(labels),
      }
    },
  )
}
export const reconcileSessionChats = ({
  session,
  providerChats,
}: {
  session: QuerySession
  providerChats: PersonalChat[]
}): void => {
  if (!session.isActive()) return
  const key = sessionChatKey(session.connectionScope)
  const current = session.client.getQueryData<SessionChatCache>(key)
  if (!current) return
  const confirmed = new Set(providerChats.map((chat) => chat.chatId))
  const pending = Object.entries(current.factsByChatId).filter(
    ([chatId]) => !confirmed.has(chatId),
  )
  session.client.setQueryData<SessionChatCache>(key, {
    factsByChatId: Object.fromEntries(pending),
    labelsByChatId: current.labelsByChatId,
  })
}
export const deriveSessionChats = ({
  providerChats,
  overlay,
}: {
  providerChats: PersonalChat[] | undefined
  overlay: SessionChatCache | undefined
}): PersonalChat[] | undefined => {
  const pending = Object.values(overlay?.factsByChatId ?? {})
  const hasKnown = providerChats !== undefined || pending.length > 0
  if (!hasKnown) return undefined
  const result = new Map(
    (providerChats ?? []).map((chat) => [chat.chatId, chat]),
  )
  for (const fact of pending) {
    const provider = result.get(fact.chatId)
    if (!provider) {
      result.set(fact.chatId, fact)
      continue
    }
    result.set(fact.chatId, {
      ...provider,
      name: provider.name ?? fact.name,
      username: provider.username ?? fact.username,
      phone: provider.phone ?? fact.phone,
    })
  }
  return [...result.values()]
}
