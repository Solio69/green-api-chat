import type { ChatsErrorCode, GetChatsOptions } from '@/lib/chats/types'
import type { MessageDTO } from '@/lib/messages/types'
import { SessionQueryError } from '@/lib/query/session-query-error'
import type { API_RESPONSE_STATUS } from '@/lib/api/constants'
import { HISTORY_CONFIG } from './constants'

const { QUERY_ERROR_NAME } = HISTORY_CONFIG

export type GetHistoryOptions = GetChatsOptions & { chatId: string }
export type GetHistoryResult =
  | { kind: typeof API_RESPONSE_STATUS.OK; messages: MessageDTO[] }
  | { kind: ChatsErrorCode }
export class HistoryQueryError extends SessionQueryError {
  declare public readonly code: ChatsErrorCode
  constructor({
    code,
    status,
  }: {
    code: ChatsErrorCode
    status: number | null
  }) {
    super({ code, status })
    this.name = QUERY_ERROR_NAME
  }
}
