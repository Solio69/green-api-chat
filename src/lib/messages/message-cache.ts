import { notifyManager } from '@tanstack/react-query'
import { mergeMessageFacts, mergeStatusFacts } from './merge-message-facts'
import type {
  MessageDTO,
  MessageStatusFact,
  MessageSource,
  MessageCache,
  EarlyStatusCache,
  MessageApplyResult,
} from './types'
import { isMessageDTO } from './validate-message'
import { isPersonalChatId, isChatId } from '@/features/chats/model'
import type { QuerySession } from '@/lib/query/create-query-session'
import {
  MESSAGE_CACHE_CONFIG,
  MESSAGE_SOURCE,
  MESSAGE_STATUS,
  MESSAGE_DIRECTION,
  MESSAGE_KIND,
} from './constants'

const { KEY, STATUS_FACTS_KEY, INVALID_FACTS } = MESSAGE_CACHE_CONFIG
const { HISTORY } = MESSAGE_SOURCE
const { ACCEPTED } = MESSAGE_STATUS
const providerStatuses: readonly string[] = Object.values(
  MESSAGE_STATUS,
).filter((status) => status !== ACCEPTED)
export const messageKey = ({
  connectionScope,
  chatId,
}: {
  connectionScope: string
  chatId: string | null
}) => [KEY, connectionScope, chatId] as const
export const applyMessageFacts = ({
  session,
  chatId,
  messages,
  statuses = [],
  source,
  now = Date.now,
}: {
  session: QuerySession
  chatId: string
  messages?: MessageDTO[]
  statuses?: MessageStatusFact[]
  source: MessageSource
  now?: () => number
}): MessageApplyResult => {
  if (!session.isActive()) return { issues: [] }
  const valid =
    isPersonalChatId(chatId) &&
    Object.values(MESSAGE_SOURCE).includes(source) &&
    (messages ?? []).every(
      (message) => isMessageDTO(message) && message.chatId === chatId,
    ) &&
    statuses.every(
      (fact) =>
        fact.chatId === chatId &&
        isChatId(fact.idMessage) &&
        providerStatuses.includes(fact.status),
    )
  if (!valid) throw new Error(INVALID_FACTS)
  const key = messageKey({ connectionScope: session.connectionScope, chatId })
  const earlyKey = [STATUS_FACTS_KEY, session.connectionScope] as const
  const current = session.client.getQueryData<MessageCache>(key)
  const early = session.client.getQueryData<EarlyStatusCache>(earlyKey) ?? {
    facts: [],
    sequence: 0,
  }
  const merged = mergeMessageFacts({
    current: current?.messages ?? [],
    messages: messages ?? [],
    source,
    contentSources: current?.contentSources,
  })
  const applied = mergeStatusFacts({
    messages: merged.messages,
    statuses,
    early,
    now: now(),
  })
  const shouldWrite =
    current !== undefined ||
    messages !== undefined ||
    applied.messages.length > 0
  const shouldWriteEarly =
    early.facts.length > 0 || applied.early.facts.length > 0
  notifyManager.batch(() => {
    if (shouldWrite)
      session.client.setQueryData<MessageCache>(
        key,
        merged.contentSources
          ? {
              messages: applied.messages,
              contentSources: merged.contentSources,
            }
          : { messages: applied.messages },
      )
    if (shouldWriteEarly)
      session.client.setQueryData<EarlyStatusCache>(earlyKey, applied.early)
  })
  return { issues: [...merged.issues, ...applied.issues] }
}
export const applyHistoryMessages = ({
  session,
  chatId,
  messages,
}: {
  session: QuerySession
  chatId: string
  messages: MessageDTO[]
}) => applyMessageFacts({ session, chatId, messages, source: HISTORY })

const { OUTGOING } = MESSAGE_DIRECTION
const { TEXT } = MESSAGE_KIND
const { ACCEPTED: ACCEPTED_SOURCE } = MESSAGE_SOURCE
export const addAcceptedMessage = ({
  session,
  chatId,
  idMessage,
  text,
  acceptedAt,
}: {
  session: QuerySession
  chatId: string
  idMessage: string
  text: string
  acceptedAt: number
}): MessageApplyResult =>
  applyMessageFacts({
    session,
    chatId,
    source: ACCEPTED_SOURCE,
    messages: [
      {
        chatId,
        idMessage,
        text,
        acceptedAt,
        direction: OUTGOING,
        kind: TEXT,
        timestamp: null,
        status: ACCEPTED,
      },
    ],
  })
