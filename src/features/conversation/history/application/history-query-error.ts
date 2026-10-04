import type { ChatsErrorCode } from '@/features/chats/model'
import { SessionQueryError } from '@/shared/query/session-query-error'
import { HISTORY_CONFIG } from '@/features/conversation/history/model/constants'

const { QUERY_ERROR_NAME } = HISTORY_CONFIG

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
