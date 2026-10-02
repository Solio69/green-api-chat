import type {
  MessageDTO,
  MessageApplyResult,
  ChatIssueFact,
  MessageStatusFact,
  EarlyStatusCache,
  MessageSource,
  MessageCache,
} from './types'
import {
  MESSAGE_CACHE_CONFIG,
  MESSAGE_STATUS,
  MESSAGE_SOURCE,
} from './constants'

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

export const mergeMessageFacts = ({
  current,
  messages,
  source = HISTORY,
  contentSources,
}: {
  current: MessageDTO[]
  messages: MessageDTO[]
  source?: MessageSource
  contentSources?: MessageCache['contentSources']
}): MessageCache & MessageApplyResult => {
  const records = new Map(
    current.map((message) => [message.idMessage, { ...message }]),
  )
  const issues: ChatIssueFact[] = []
  const sources = new Map(Object.entries(contentSources ?? {}))
  const trackSources = contentSources !== undefined || source !== HISTORY
  for (const message of messages) {
    const previous = records.get(message.idMessage)
    if (!previous) {
      records.set(message.idMessage, { ...message })
      if (trackSources) sources.set(message.idMessage, source)
      continue
    }
    const { status, issue } = mergeMessageStatus({ previous, next: message })
    if (issue) issues.push(issue)
    const hasProviderTimestamp = previous.timestamp !== null
    const hasKnownText = previous.text !== null
    const previousSource = sources.get(message.idMessage) ?? HISTORY
    const replacesAccepted =
      previousSource === ACCEPTED_SOURCE && source !== ACCEPTED_SOURCE
    const keepKnownText =
      hasKnownText && (!replacesAccepted || message.text === null)
    records.set(message.idMessage, {
      ...message,
      timestamp: hasProviderTimestamp ? previous.timestamp : message.timestamp,
      acceptedAt: previous.acceptedAt ?? message.acceptedAt,
      kind: keepKnownText ? previous.kind : message.kind,
      text: keepKnownText ? previous.text : (message.text ?? previous.text),
      status,
    })
    if (trackSources)
      sources.set(
        message.idMessage,
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
  if (trackSources)
    return {
      messages: result,
      contentSources: Object.fromEntries(sources),
      issues,
    }
  return { messages: result, issues }
}

const { EARLY_FACT_TTL_MS, EARLY_FACT_LIMIT } = MESSAGE_CACHE_CONFIG
const factIdentity = (fact: Pick<MessageStatusFact, 'chatId' | 'idMessage'>) =>
  JSON.stringify([fact.chatId, fact.idMessage])

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
    const changed = result.status !== previous.fact.status
    const previousIssues = previous.issues
    const isNewIssue =
      result.issue !== null &&
      !previousIssues.some((issue) => issue.code === result.issue!.code)
    const nextIssues = isNewIssue
      ? [...previousIssues, result.issue!]
      : previousIssues
    if (isNewIssue) issues.push(result.issue!)
    pending.set(identity, {
      fact: {
        ...previous.fact,
        status: result.status as MessageStatusFact['status'],
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
