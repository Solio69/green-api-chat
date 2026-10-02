import type { MessageDTO, MessageApplyResult, ChatIssueFact } from './types'
import { MESSAGE_CACHE_CONFIG, MESSAGE_STATUS } from './constants'

const { MILLISECONDS_PER_SECOND } = MESSAGE_CACHE_CONFIG
const { ACCEPTED, DELIVERED, READ, FAILED, NO_ACCOUNT } = MESSAGE_STATUS
const statusRank = { [ACCEPTED]: 1, [DELIVERED]: 2, [READ]: 3 } as const
const isFailure = (
  status: MessageDTO['status'],
): status is typeof FAILED | typeof NO_ACCOUNT =>
  status === FAILED || status === NO_ACCOUNT
const isConfirmed = (status: MessageDTO['status']) =>
  status === DELIVERED || status === READ
const mergeStatus = ({
  previous,
  next,
}: {
  previous: MessageDTO
  next: MessageDTO
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
}: {
  current: MessageDTO[]
  messages: MessageDTO[]
}): { messages: MessageDTO[] } & MessageApplyResult => {
  const records = new Map(
    current.map((message) => [message.idMessage, { ...message }]),
  )
  const issues: ChatIssueFact[] = []
  for (const message of messages) {
    const previous = records.get(message.idMessage)
    if (!previous) {
      records.set(message.idMessage, { ...message })
      continue
    }
    const { status, issue } = mergeStatus({ previous, next: message })
    if (issue) issues.push(issue)
    const hasProviderTimestamp = previous.timestamp !== null
    const hasKnownText = previous.text !== null
    records.set(message.idMessage, {
      ...message,
      timestamp: hasProviderTimestamp ? previous.timestamp : message.timestamp,
      acceptedAt: previous.acceptedAt ?? message.acceptedAt,
      kind: hasKnownText ? previous.kind : message.kind,
      text: hasKnownText ? previous.text : message.text,
      status,
    })
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
  return { messages: result, issues }
}
