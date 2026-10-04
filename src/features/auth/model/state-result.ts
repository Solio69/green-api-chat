import type { GREEN_API_STATES } from './green-api-states'
import type { API_ERROR_CODE } from '@/shared/kernel/api/constants'

export type StateResult =
  | {
      kind: typeof GREEN_API_STATES.AUTHORIZED
      body: { stateInstance: typeof GREEN_API_STATES.AUTHORIZED }
    }
  | {
      kind:
        | typeof API_ERROR_CODE.NEEDS_AUTHORIZATION
        | typeof API_ERROR_CODE.INSTANCE_RESTRICTED
      stateInstance: string
    }
  | {
      kind:
        | typeof API_ERROR_CODE.INVALID_TOKEN
        | typeof API_ERROR_CODE.INVALID_INSTANCE
        | typeof API_ERROR_CODE.INSTANCE_EXPIRED
        | typeof API_ERROR_CODE.RETRY_LATER
        | typeof API_ERROR_CODE.RATE_LIMITED
        | typeof API_ERROR_CODE.SERVICE_UNAVAILABLE
        | typeof API_ERROR_CODE.INVALID_UPSTREAM_RESPONSE
    }
