import type {
  MESSAGE_DIRECTION,
  MESSAGE_KIND,
  MESSAGE_STATUS,
  MESSAGE_SOURCE,
} from './constants'

export type ProviderMessageStatus = Exclude<
  (typeof MESSAGE_STATUS)[keyof typeof MESSAGE_STATUS],
  typeof MESSAGE_STATUS.ACCEPTED
>
export type MessageDTO = {
  chatId: string
  idMessage: string
  direction: (typeof MESSAGE_DIRECTION)[keyof typeof MESSAGE_DIRECTION]
  kind: (typeof MESSAGE_KIND)[keyof typeof MESSAGE_KIND]
  text: string | null
  timestamp: number | null
  acceptedAt: number | null
  status: ProviderMessageStatus | typeof MESSAGE_STATUS.ACCEPTED | null
}
export type MessageView = Readonly<MessageDTO>
export type MessageFact = Readonly<{
  message: MessageDTO
  source: MessageSource
}>
export type ChatIssueFact = {
  chatId: string | null
  idMessage: string | null
  code: typeof MESSAGE_STATUS.FAILED | typeof MESSAGE_STATUS.NO_ACCOUNT
}
export type MessageApplyResult = { issues: ChatIssueFact[] }
export type MessageCache = {
  messages: MessageView[]
  contentSources?: Readonly<Record<string, MessageSource>>
}
export type MessageSource = (typeof MESSAGE_SOURCE)[keyof typeof MESSAGE_SOURCE]
export type MessageStatusFact = {
  chatId: string
  idMessage: string
  status: ProviderMessageStatus
}
export type EarlyStatusFact = {
  fact: MessageStatusFact
  observedAt: number
  sequence: number
  issues: ChatIssueFact[]
}
export type EarlyStatusCache = { facts: EarlyStatusFact[]; sequence: number }
export type MessageIssue = ChatIssueFact
