import type { InstanceCredentials } from '@/shared/kernel/api/instance-credentials'
import type {
  API_ERROR_CODE,
  API_RESPONSE_STATUS,
} from '@/shared/kernel/api/constants'

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
