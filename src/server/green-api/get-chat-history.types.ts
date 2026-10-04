import type { GetChatsOptions } from './get-chats.types'
import type { ChatsErrorCode } from '@/features/chats/model'
import type { MessageDTO } from '@/features/conversation/messages/model'
import type { API_RESPONSE_STATUS } from '@/shared/kernel/api/constants'

export type GetHistoryOptions = GetChatsOptions & { chatId: string }
export type GetHistoryResult =
  | { kind: typeof API_RESPONSE_STATUS.OK; messages: MessageDTO[] }
  | { kind: ChatsErrorCode }
