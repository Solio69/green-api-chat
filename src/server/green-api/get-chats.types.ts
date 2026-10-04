import type { PersonalChat, ChatsErrorCode } from '@/features/chats/model'
import type { InstanceCredentials } from '@/shared/kernel/api/instance-credentials'
import type { API_RESPONSE_STATUS } from '@/shared/kernel/api/constants'

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
