import type { InstanceCredentials } from '@/lib/green-api/get-state'
import type { API_ERROR_CODE } from '@/lib/api/constants'
import { CHAT_QUERY_CONFIG } from './constants'

const { QUERY_ERROR_NAME } = CHAT_QUERY_CONFIG

export type PersonalChat = {
  chatId: string
  name: string | null
  username: string | null
  phone: string | null
}
export type ChatsErrorCode =
  (typeof API_ERROR_CODE)[keyof typeof API_ERROR_CODE]
export type GetChatsResult =
  { kind: 'ok'; chats: PersonalChat[] } | { kind: ChatsErrorCode }
export type GetChatsOptions = {
  credentials: InstanceCredentials
  signal?: AbortSignal
  fetcher?: typeof fetch
  waitForRetry?: (options: {
    delay: number
    signal: AbortSignal
  }) => Promise<void>
}
export class ChatsQueryError extends Error {
  public readonly code: ChatsErrorCode
  public readonly status: number | null
  constructor({
    code,
    status,
  }: {
    code: ChatsErrorCode
    status: number | null
  }) {
    super(code)
    this.code = code
    this.status = status
    this.name = QUERY_ERROR_NAME
  }
}
