import { setTimeout as wait } from 'node:timers/promises'
import { fetchGreenApi } from './transport'
import { isRecord } from '@/lib/api/is-record'
import { API_ERROR_CODE } from '@/lib/api/constants'
import { HTTP_METHOD, HTTP_STATUS } from '@/lib/http/constants'
import {
  GREEN_API_BAD_REQUEST,
  GREEN_API_CONFIG,
  GREEN_API_STATES,
} from './constants'

const {
  INVALID_TOKEN,
  INVALID_INSTANCE,
  NEEDS_AUTHORIZATION,
  INSTANCE_RESTRICTED,
  INSTANCE_EXPIRED,
  RETRY_LATER,
  RATE_LIMITED,
  SERVICE_UNAVAILABLE,
  INVALID_UPSTREAM_RESPONSE,
} = API_ERROR_CODE
const {
  OK: HTTP_OK,
  BAD_REQUEST: HTTP_BAD_REQUEST,
  UNAUTHORIZED: HTTP_UNAUTHORIZED,
  FORBIDDEN: HTTP_FORBIDDEN,
  TOO_MANY_REQUESTS: HTTP_TOO_MANY_REQUESTS,
  SERVER_ERROR_START,
} = HTTP_STATUS
const { GET: HTTP_GET } = HTTP_METHOD
const { METHOD, TIMEOUT_MS, RATE_LIMIT_RETRY_DELAY_MS } = GREEN_API_CONFIG
const {
  AUTHORIZED,
  NOT_AUTHORIZED,
  PENDING_PASSWORD,
  BLOCKED,
  SUSPENDED,
  STARTING,
} = GREEN_API_STATES
const { STARTING: ERROR_STARTING, AMBIGUOUS, EXPIRED } = GREEN_API_BAD_REQUEST

export type InstanceCredentials = {
  idInstance: string
  apiTokenInstance: string
}

export type StateResult =
  | { kind: typeof AUTHORIZED; body: { stateInstance: typeof AUTHORIZED } }
  | {
      kind: typeof NEEDS_AUTHORIZATION | typeof INSTANCE_RESTRICTED
      stateInstance: string
    }
  | {
      kind:
        | typeof INVALID_TOKEN
        | typeof INVALID_INSTANCE
        | typeof INSTANCE_EXPIRED
        | typeof RETRY_LATER
        | typeof RATE_LIMITED
        | typeof SERVICE_UNAVAILABLE
        | typeof INVALID_UPSTREAM_RESPONSE
    }

export const classifyBadRequest = (
  responseText: string,
): Exclude<StateResult, { kind: typeof AUTHORIZED }> => {
  const normalized = responseText.toLowerCase()
  const isStarting =
    normalized.includes(ERROR_STARTING) || normalized.includes(AMBIGUOUS)
  if (isStarting) return { kind: RETRY_LATER }
  if (normalized.includes(EXPIRED.toLowerCase()))
    return { kind: INSTANCE_EXPIRED }

  return { kind: INVALID_UPSTREAM_RESPONSE }
}

export const classifyState = (value: unknown): StateResult => {
  if (!isRecord(value)) return { kind: INVALID_UPSTREAM_RESPONSE }
  const { stateInstance } = value
  switch (stateInstance) {
    case AUTHORIZED:
      return { kind: AUTHORIZED, body: { stateInstance: AUTHORIZED } }
    case NOT_AUTHORIZED:
    case PENDING_PASSWORD:
      return { kind: NEEDS_AUTHORIZATION, stateInstance }
    case BLOCKED:
    case SUSPENDED:
      return { kind: INSTANCE_RESTRICTED, stateInstance }
    case STARTING:
      return { kind: RETRY_LATER }
    default:
      return { kind: INVALID_UPSTREAM_RESPONSE }
  }
}

export const getStateInstance = async ({
  credentials,
  fetcher = fetch,
  waitForRetry = async ({ delay, signal }) =>
    wait(delay, undefined, { signal }),
}: {
  credentials: InstanceCredentials
  fetcher?: typeof fetch
  waitForRetry?: (options: {
    delay: number
    signal: AbortSignal
  }) => Promise<void>
}): Promise<StateResult> => {
  try {
    const signal = AbortSignal.timeout(TIMEOUT_MS)
    const requestState = () =>
      fetchGreenApi({
        credentials,
        methodName: METHOD,
        method: HTTP_GET,
        signal,
        fetcher,
      })
    let response = await requestState()
    if (response.status === HTTP_TOO_MANY_REQUESTS) {
      await waitForRetry({ delay: RATE_LIMIT_RETRY_DELAY_MS, signal })
      response = await requestState()
      if (response.status === HTTP_TOO_MANY_REQUESTS)
        return { kind: RATE_LIMITED }
    }
    if (response.status === HTTP_UNAUTHORIZED) return { kind: INVALID_TOKEN }
    if (response.status === HTTP_FORBIDDEN) return { kind: INVALID_INSTANCE }
    if (response.status >= SERVER_ERROR_START)
      return { kind: SERVICE_UNAVAILABLE }
    if (response.status === HTTP_BAD_REQUEST)
      return classifyBadRequest(await response.text())
    if (response.status !== HTTP_OK) return { kind: INVALID_UPSTREAM_RESPONSE }
    const body = await response.text()
    try {
      return classifyState(JSON.parse(body))
    } catch {
      return { kind: INVALID_UPSTREAM_RESPONSE }
    }
  } catch {
    return { kind: SERVICE_UNAVAILABLE }
  }
}
