import type { ChatsErrorCode } from '@/features/chats/model'
import { SessionQueryError } from '@/lib/query/session-query-error'
import { CHAT_QUERY_CONFIG } from './constants'

const { QUERY_ERROR_NAME } = CHAT_QUERY_CONFIG

export class ChatsQueryError extends SessionQueryError {
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
