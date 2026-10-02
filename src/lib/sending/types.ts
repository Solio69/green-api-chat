import type { InstanceCredentials } from '@/lib/green-api/get-state'
import type { API_ERROR_CODE, API_RESPONSE_STATUS } from '@/lib/api/constants'
import type { SEND_OUTCOME } from './constants'

export type SendRequest = {
  chatId: string
  message: string
  attemptId: string
}
export type ProviderSendResult =
  | { kind: typeof API_RESPONSE_STATUS.OK; idMessage: string }
  | {
      kind:
        | typeof API_ERROR_CODE.INVALID_TOKEN
        | typeof API_ERROR_CODE.INVALID_INSTANCE
        | typeof API_ERROR_CODE.INSTANCE_EXPIRED
        | typeof API_ERROR_CODE.NEEDS_AUTHORIZATION
        | typeof API_ERROR_CODE.INSTANCE_RESTRICTED
        | typeof API_ERROR_CODE.UPSTREAM_REJECTED
        | typeof API_ERROR_CODE.RATE_LIMITED
        | typeof API_ERROR_CODE.OUTCOME_UNKNOWN
    }
export type SendMessageOptions = {
  credentials: InstanceCredentials
  chatId: string
  message: string
  fetcher?: typeof fetch
  signal?: AbortSignal
}
export type SendLeaseResult =
  | { kind: typeof API_RESPONSE_STATUS.OK; release: () => void }
  | { kind: 'not_owner' | 'receiver_not_active' | 'send_in_progress' }
export type AcquireSendOptions = {
  credentials: InstanceCredentials
  connectionScope: string
  ownerCapability: string
  attemptId: string
  now?: number
}
export type SendRequestOptions = {
  request: Request
  context: {
    configured: boolean
    credentials: InstanceCredentials | null
    connectionScope: string | null
    ownerCapability: string | null
  }
  send: (options: SendMessageOptions) => Promise<ProviderSendResult>
  clearSession: () => Promise<void>
  tryAcquireSend: (options: AcquireSendOptions) => SendLeaseResult
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
  code:
    | (typeof API_ERROR_CODE)[keyof typeof API_ERROR_CODE]
    | Exclude<SendLeaseResult, { kind: typeof API_RESPONSE_STATUS.OK }>['kind']
  outcome: (typeof SEND_OUTCOME)[keyof typeof SEND_OUTCOME]
}
