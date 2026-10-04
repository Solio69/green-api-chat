import type {
  API_ERROR_CODE,
  API_RESPONSE_STATUS,
} from '@/shared/kernel/api/constants'
import type { SEND_OUTCOME } from './constants'

export type SendRequest = {
  chatId: string
  message: string
  attemptId: string
}
export type AcceptedSend = {
  status: typeof API_RESPONSE_STATUS.OK
  connectionScope: string
  chatId: string
  attemptId: string
  idMessage: string
}
export type SendFailure = {
  status: typeof API_RESPONSE_STATUS.ERROR
  code: (typeof API_ERROR_CODE)[keyof typeof API_ERROR_CODE]
  outcome: (typeof SEND_OUTCOME)[keyof typeof SEND_OUTCOME]
}
