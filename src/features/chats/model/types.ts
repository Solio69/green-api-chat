import type { API_ERROR_CODE } from '@/shared/kernel/api/constants'

export type PersonalChat = {
  chatId: string
  name: string | null
  username: string | null
  phone: string | null
}
export type ChatsErrorCode =
  (typeof API_ERROR_CODE)[keyof typeof API_ERROR_CODE]
