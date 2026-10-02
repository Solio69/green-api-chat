import type {
  MESSAGE_DIRECTION,
  MESSAGE_KIND,
  MESSAGE_STATUS,
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
export type ChatIssueFact = {
  chatId: string | null
  idMessage: string | null
  code: typeof MESSAGE_STATUS.FAILED | typeof MESSAGE_STATUS.NO_ACCOUNT
}
export type MessageApplyResult = { issues: ChatIssueFact[] }
export type MessageCache = { messages: MessageDTO[] }
