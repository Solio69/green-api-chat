import { isMessageDTO } from './validate-message'
import { isPersonalChatId } from '@/features/chats/model'
import type {
  MessageDTO,
  MessageFact,
  MessageView,
  MessageApplyResult,
  ChatIssueFact,
  MessageStatusFact,
  EarlyStatusCache,
  MessageSource,
  MessageCache,
} from '@/features/conversation/messages/model/types'
import {
  MESSAGE_CACHE_CONFIG,
  MESSAGE_STATUS,
  MESSAGE_SOURCE,
} from '@/features/conversation/messages/model/constants'

const { MILLISECONDS_PER_SECOND } = MESSAGE_CACHE_CONFIG
const { ACCEPTED, DELIVERED, READ, FAILED, NO_ACCOUNT } = MESSAGE_STATUS
const { HISTORY, LIVE, ACCEPTED: ACCEPTED_SOURCE } = MESSAGE_SOURCE
const sourceRank = { [ACCEPTED_SOURCE]: 0, [HISTORY]: 1, [LIVE]: 2 } as const
const statusRank = { [ACCEPTED]: 1, [DELIVERED]: 2, [READ]: 3 } as const
const isFailure = (
  status: MessageDTO['status'],
): status is typeof FAILED | typeof NO_ACCOUNT =>
  status === FAILED || status === NO_ACCOUNT
const isConfirmed = (status: MessageDTO['status']) =>
  status === DELIVERED || status === READ
export const mergeMessageStatus = ({
  previous,
  next,
}: {
  previous: Pick<MessageDTO, 'chatId' | 'idMessage' | 'status'>
  next: Pick<MessageDTO, 'chatId' | 'idMessage' | 'status'>
}): { status: MessageDTO['status']; issue: ChatIssueFact | null } => {
  const mismatchedIdentity =
    previous.chatId !== next.chatId || previous.idMessage !== next.idMessage
  if (mismatchedIdentity) throw new Error(MESSAGE_CACHE_CONFIG.INVALID_FACTS)
  const previousStatus = previous.status
  const nextStatus = next.status
  const previousFailure = isFailure(previousStatus)
  const nextFailure = isFailure(nextStatus)
  const conflict =
    (previousFailure && isConfirmed(nextStatus)) ||
    (nextFailure && isConfirmed(previousStatus)) ||
    (previousFailure && nextFailure && previousStatus !== nextStatus)
  let issue: ChatIssueFact | null = null
  if (conflict) {
    const code = nextFailure ? nextStatus : previousStatus
    if (isFailure(code))
      issue = { chatId: next.chatId, idMessage: next.idMessage, code }
  }
  if (isConfirmed(previousStatus)) {
    const status = nextStatus === READ ? READ : previousStatus
    return { status, issue }
  }
  if (isConfirmed(nextStatus)) return { status: nextStatus, issue }
  if (previousFailure) return { status: previousStatus, issue }
  if (nextFailure) return { status: nextStatus, issue }
  const previousRank = previousStatus === null ? 0 : statusRank[previousStatus]
  const nextRank = nextStatus === null ? 0 : statusRank[nextStatus]
  return {
    status: nextRank > previousRank ? nextStatus : previousStatus,
    issue,
  }
}
const knownTime = (message: MessageDTO) =>
  message.timestamp === null
    ? message.acceptedAt
    : message.timestamp * MILLISECONDS_PER_SECOND

export const messageIdentity = ({
  chatId,
  idMessage,
}: {
  chatId: string
  idMessage: string
}) => JSON.stringify([chatId, idMessage])

export const mergeValidatedMessageFacts = ({
  current,
  facts,
  contentSources,
  trackSources = false,
}: {
  current: MessageView[]
  facts: MessageFact[]
  contentSources?: MessageCache['contentSources']
  trackSources?: boolean
}): MessageCache & MessageApplyResult => {
  const sourcesAllowed: readonly string[] = Object.values(MESSAGE_SOURCE)
  const valid =
    current.every((message) => isMessageDTO(message)) &&
    facts.every(
      ({ message, source }) =>
        isMessageDTO(message) &&
        isPersonalChatId(message.chatId) &&
        sourcesAllowed.includes(source),
    )
  if (!valid) throw new Error(MESSAGE_CACHE_CONFIG.INVALID_FACTS)
  const records = new Map(
    current.map((message) => [messageIdentity(message), { ...message }]),
  )
  const issues: ChatIssueFact[] = []
  const sources = new Map(Object.entries(contentSources ?? {}))
  const shouldTrackSources =
    trackSources ||
    contentSources !== undefined ||
    facts.some(({ source }) => source !== HISTORY)
  for (const { message, source } of facts) {
    const identity = messageIdentity(message)
    const previous = records.get(identity)
    if (!previous) {
      records.set(identity, { ...message })
      if (shouldTrackSources) sources.set(identity, source)
      continue
    }
    const { status, issue } = mergeMessageStatus({ previous, next: message })
    if (issue) issues.push(issue)
    const hasProviderTimestamp = previous.timestamp !== null
    const hasKnownText = previous.text !== null
    const previousSource = sources.get(identity) ?? HISTORY
    const replacesAccepted =
      previousSource === ACCEPTED_SOURCE && source !== ACCEPTED_SOURCE
    const keepKnownText =
      hasKnownText && (!replacesAccepted || message.text === null)
    records.set(identity, {
      ...message,
      timestamp: hasProviderTimestamp ? previous.timestamp : message.timestamp,
      acceptedAt: previous.acceptedAt ?? message.acceptedAt,
      kind: keepKnownText ? previous.kind : message.kind,
      text: keepKnownText ? previous.text : (message.text ?? previous.text),
      status,
    })
    if (shouldTrackSources)
      sources.set(
        identity,
        sourceRank[source] > sourceRank[previousSource]
          ? source
          : previousSource,
      )
  }
  const result = [...records.values()]
  result.sort((first, second) => {
    const firstTime = knownTime(first)
    const secondTime = knownTime(second)
    const bothKnown = firstTime !== null && secondTime !== null
    if (!bothKnown) return 0
    return (
      firstTime - secondTime || first.idMessage.localeCompare(second.idMessage)
    )
  })
  if (shouldTrackSources)
    return {
      messages: result,
      contentSources: Object.fromEntries(sources),
      issues,
    }
  return { messages: result, issues }
}

export const mergeMessageFacts = ({
  current,
  messages,
  source = HISTORY,
  contentSources,
}: {
  current: MessageView[]
  messages: MessageDTO[]
  source?: MessageSource
  contentSources?: MessageCache['contentSources']
}): MessageCache & MessageApplyResult =>
  mergeValidatedMessageFacts({
    current,
    facts: messages.map((message) => ({ message, source })),
    contentSources,
    trackSources: source !== HISTORY,
  })
const { EARLY_FACT_TTL_MS, EARLY_FACT_LIMIT } = MESSAGE_CACHE_CONFIG
const factIdentity = messageIdentity

export const mergeStatusFacts = ({
  messages,
  statuses,
  early,
  now,
}: {
  messages: MessageDTO[]
  statuses: MessageStatusFact[]
  early: EarlyStatusCache
  now: number
}): {
  messages: MessageDTO[]
  early: EarlyStatusCache
} & MessageApplyResult => {
  const records = new Map(
    messages.map((message) => [factIdentity(message), { ...message }]),
  )
  const pending = new Map(
    early.facts
      .filter((item) => now - item.observedAt < EARLY_FACT_TTL_MS)
      .map((item) => [
        factIdentity(item.fact),
        { ...item, issues: [...item.issues] },
      ]),
  )
  const issues: ChatIssueFact[] = []
  let sequence = early.sequence
  for (const fact of statuses) {
    const identity = factIdentity(fact)
    const message = records.get(identity)
    if (message) {
      const result = mergeMessageStatus({ previous: message, next: fact })
      records.set(identity, { ...message, status: result.status })
      if (result.issue) issues.push(result.issue)
      continue
    }
    const previous = pending.get(identity)
    if (!previous) {
      pending.set(identity, {
        fact: { ...fact },
        observedAt: now,
        sequence: sequence++,
        issues: [],
      })
      continue
    }
    const result = mergeMessageStatus({ previous: previous.fact, next: fact })
    const status = result.status
    if (status === null || status === ACCEPTED)
      throw new Error(MESSAGE_CACHE_CONFIG.INVALID_FACTS)
    const changed = status !== previous.fact.status
    const previousIssues = previous.issues
    const newIssue = result.issue
    const isNewIssue =
      newIssue !== null &&
      !previousIssues.some((issue) => issue.code === newIssue.code)
    const nextIssues =
      isNewIssue && newIssue !== null
        ? [...previousIssues, newIssue]
        : previousIssues
    if (isNewIssue && newIssue !== null) issues.push(newIssue)
    pending.set(identity, {
      fact: {
        ...previous.fact,
        status,
      },
      observedAt: changed ? now : previous.observedAt,
      sequence: changed ? sequence++ : previous.sequence,
      issues: nextIssues,
    })
  }
  for (const [identity, item] of pending) {
    const message = records.get(identity)
    if (!message) continue
    const result = mergeMessageStatus({ previous: message, next: item.fact })
    records.set(identity, { ...message, status: result.status })
    issues.push(...item.issues)
    if (result.issue) issues.push(result.issue)
    pending.delete(identity)
  }
  const facts = [...pending.values()]
    .sort(
      (first, second) =>
        first.observedAt - second.observedAt ||
        first.sequence - second.sequence,
    )
    .slice(-EARLY_FACT_LIMIT)
  return { messages: [...records.values()], early: { facts, sequence }, issues }
}
