import type { StateResult } from '@/features/auth/model'
import { GREEN_API_STATES } from '@/features/auth/model'
import type { InstanceCredentials } from '@/shared/kernel/api/instance-credentials'
import { isRecord } from '@/shared/kernel/api/is-record'
import {
  API_ERROR_CODE,
  API_RESPONSE_STATUS,
} from '@/shared/kernel/api/constants'
import { HTTP_BODY_LIMIT, HTTP_STATUS } from '@/shared/kernel/http/constants'

const {
  INVALID_REQUEST,
  INVALID_TOKEN,
  INVALID_INSTANCE,
  NEEDS_AUTHORIZATION,
  INSTANCE_RESTRICTED,
  INSTANCE_EXPIRED,
  RETRY_LATER,
  RATE_LIMITED,
  SERVICE_UNAVAILABLE,
  INVALID_UPSTREAM_RESPONSE,
  SERVER_UNAVAILABLE,
} = API_ERROR_CODE
const { OK: RESPONSE_OK, ERROR: RESPONSE_ERROR } = API_RESPONSE_STATUS
const {
  OK: HTTP_OK,
  BAD_REQUEST: HTTP_BAD_REQUEST,
  UNAUTHORIZED: HTTP_UNAUTHORIZED,
  CONFLICT: HTTP_CONFLICT,
  TOO_MANY_REQUESTS: HTTP_TOO_MANY_REQUESTS,
  BAD_GATEWAY: HTTP_BAD_GATEWAY,
  SERVICE_UNAVAILABLE: HTTP_SERVICE_UNAVAILABLE,
} = HTTP_STATUS
const { MAX_REQUEST_BYTES } = HTTP_BODY_LIMIT
const { AUTHORIZED } = GREEN_API_STATES

const ERROR_HTTP_STATUS = {
  [INVALID_TOKEN]: HTTP_UNAUTHORIZED,
  [INVALID_INSTANCE]: HTTP_UNAUTHORIZED,
  [NEEDS_AUTHORIZATION]: HTTP_CONFLICT,
  [INSTANCE_RESTRICTED]: HTTP_CONFLICT,
  [INSTANCE_EXPIRED]: HTTP_CONFLICT,
  [RETRY_LATER]: HTTP_SERVICE_UNAVAILABLE,
  [RATE_LIMITED]: HTTP_TOO_MANY_REQUESTS,
  [SERVICE_UNAVAILABLE]: HTTP_SERVICE_UNAVAILABLE,
  [INVALID_UPSTREAM_RESPONSE]: HTTP_BAD_GATEWAY,
} as const

export type LoginResult = {
  status: number
  body: {
    status: typeof RESPONSE_OK | typeof RESPONSE_ERROR
    code?: string
    stateInstance?: string
  }
}

const parseCredentials = (rawBody: string): InstanceCredentials | null => {
  const isInvalidBody =
    new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES ||
    rawBody.length === 0
  if (isInvalidBody) return null
  try {
    const value: unknown = JSON.parse(rawBody)
    if (!isRecord(value)) return null
    const { idInstance, apiTokenInstance } = value
    const isInvalidCredentials =
      typeof idInstance !== 'string' ||
      typeof apiTokenInstance !== 'string' ||
      idInstance.trim().length === 0 ||
      apiTokenInstance.trim().length === 0
    if (isInvalidCredentials) return null
    return { idInstance, apiTokenInstance }
  } catch {
    return null
  }
}

export const resolveLogin = async ({
  rawBody,
  getState,
  saveSession,
}: {
  rawBody: string
  getState: (credentials: InstanceCredentials) => Promise<StateResult>
  saveSession: (credentials: InstanceCredentials) => Promise<void>
}): Promise<LoginResult> => {
  const credentials = parseCredentials(rawBody)
  if (!credentials) {
    return {
      status: HTTP_BAD_REQUEST,
      body: { status: RESPONSE_ERROR, code: INVALID_REQUEST },
    }
  }

  let state: StateResult
  try {
    state = await getState(credentials)
  } catch {
    return {
      status: HTTP_SERVICE_UNAVAILABLE,
      body: { status: RESPONSE_ERROR, code: SERVICE_UNAVAILABLE },
    }
  }

  if (state.kind === AUTHORIZED) {
    try {
      await saveSession(credentials)
      return { status: HTTP_OK, body: { status: RESPONSE_OK } }
    } catch {
      return {
        status: HTTP_SERVICE_UNAVAILABLE,
        body: { status: RESPONSE_ERROR, code: SERVER_UNAVAILABLE },
      }
    }
  }

  return {
    status: ERROR_HTTP_STATUS[state.kind],
    body: {
      status: RESPONSE_ERROR,
      code: state.kind,
      ...('stateInstance' in state && { stateInstance: state.stateInstance }),
    },
  }
}
