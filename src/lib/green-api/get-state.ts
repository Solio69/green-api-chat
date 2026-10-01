import { setTimeout as wait } from 'node:timers/promises'
import { API_ERROR_CODE } from '@/lib/api/constants'
import {
  CACHE_CONTROL,
  FETCH_REDIRECT,
  HTTP_METHOD,
  HTTP_STATUS,
} from '@/lib/http/constants'
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
const { NO_STORE } = CACHE_CONTROL
const { ERROR: REDIRECT_ERROR } = FETCH_REDIRECT
const {
  HOST,
  INSTANCE_PATH_PREFIX,
  METHOD,
  TIMEOUT_MS,
  RATE_LIMIT_RETRY_DELAY_MS,
} = GREEN_API_CONFIG
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

const classifyBadRequest = (responseText: string): StateResult => {
  const normalized = responseText.toLowerCase()
  if (normalized.includes(ERROR_STARTING) || normalized.includes(AMBIGUOUS))
    return { kind: RETRY_LATER }
  if (normalized.includes(EXPIRED.toLowerCase()))
    return { kind: INSTANCE_EXPIRED }
  return { kind: INVALID_UPSTREAM_RESPONSE }
}

const classifyState = (value: unknown): StateResult => {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return { kind: INVALID_UPSTREAM_RESPONSE }
  const stateInstance = (value as Record<string, unknown>).stateInstance
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

export const getStateInstance = async (
  credentials: InstanceCredentials,
  fetcher: typeof fetch = fetch,
  waitForRetry: (delay: number, signal: AbortSignal) => Promise<void> = async (
    delay,
    signal,
  ) => wait(delay, undefined, { signal }),
): Promise<StateResult> => {
  const id = encodeURIComponent(credentials.idInstance)
  const token = encodeURIComponent(credentials.apiTokenInstance)
  const url = `${HOST}/${INSTANCE_PATH_PREFIX}${id}/${METHOD}/${token}`
  try {
    const signal = AbortSignal.timeout(TIMEOUT_MS)
    const requestState = () =>
      fetcher(url, {
        method: HTTP_GET,
        cache: NO_STORE,
        redirect: REDIRECT_ERROR,
        signal,
      })
    let response = await requestState()
    if (response.status === HTTP_TOO_MANY_REQUESTS) {
      await waitForRetry(RATE_LIMIT_RETRY_DELAY_MS, signal)
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
