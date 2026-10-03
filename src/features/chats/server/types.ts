import type { PersonalChat, ChatsErrorCode } from '@/features/chats/model'
import type { InstanceCredentials } from '@/lib/green-api/get-state'
import type { API_RESPONSE_STATUS } from '@/lib/api/constants'

export type GetChatsResult =
  | { kind: typeof API_RESPONSE_STATUS.OK; chats: PersonalChat[] }
  | { kind: ChatsErrorCode }
export type GetChatsOptions = {
  credentials: InstanceCredentials
  signal?: AbortSignal
  fetcher?: typeof fetch
  waitForRetry?: (options: {
    delay: number
    signal: AbortSignal
  }) => Promise<void>
}
