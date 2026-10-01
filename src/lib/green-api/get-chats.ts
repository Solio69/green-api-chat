import { setTimeout as wait } from 'node:timers/promises'
import { classifyBadRequest } from './get-state'
import { normalizeChats } from '@/lib/chats/normalize-chats'
import type { GetChatsOptions, GetChatsResult } from '@/lib/chats/types'
import { API_ERROR_CODE, API_RESPONSE_STATUS } from '@/lib/api/constants'
import {
  CACHE_CONTROL,
  FETCH_REDIRECT,
  HTTP_METHOD,
  HTTP_STATUS,
} from '@/lib/http/constants'
import { GREEN_API_CONFIG } from './constants'

const {
  HOST,
  INSTANCE_PATH_PREFIX,
  CHATS_METHOD,
  TIMEOUT_MS,
  RATE_LIMIT_RETRY_DELAY_MS,
} = GREEN_API_CONFIG
const {
  INVALID_TOKEN,
  INVALID_INSTANCE,
  RATE_LIMITED,
  SERVICE_UNAVAILABLE,
  INVALID_UPSTREAM_RESPONSE,
} = API_ERROR_CODE
const { OK: RESPONSE_OK } = API_RESPONSE_STATUS
const {
  OK,
  BAD_REQUEST,
  UNAUTHORIZED,
  FORBIDDEN,
  TOO_MANY_REQUESTS,
  SERVER_ERROR_START,
} = HTTP_STATUS
const { GET } = HTTP_METHOD
const { NO_STORE } = CACHE_CONTROL
const { ERROR: REDIRECT_ERROR } = FETCH_REDIRECT
const waitForRateLimit = ({
  delay,
  signal,
}: {
  delay: number
  signal: AbortSignal
}) => wait(delay, undefined, { signal })

export const getChats = async ({
  credentials,
  signal: callerSignal,
  fetcher = fetch,
  waitForRetry = waitForRateLimit,
}: GetChatsOptions): Promise<GetChatsResult> => {
  const id = encodeURIComponent(credentials.idInstance)
  const token = encodeURIComponent(credentials.apiTokenInstance)
  const url = `${HOST}/${INSTANCE_PATH_PREFIX}${id}/${CHATS_METHOD}/${token}`
  const deadline = AbortSignal.timeout(TIMEOUT_MS)
  const signal = callerSignal
    ? AbortSignal.any([callerSignal, deadline])
    : deadline
  try {
    signal.throwIfAborted()
    const request = () =>
      fetcher(url, {
        method: GET,
        cache: NO_STORE,
        redirect: REDIRECT_ERROR,
        signal,
      })
    let response = await request()
    signal.throwIfAborted()
    if (response.status === TOO_MANY_REQUESTS) {
      await response.body?.cancel()
      await waitForRetry({ delay: RATE_LIMIT_RETRY_DELAY_MS, signal })
      signal.throwIfAborted()
      response = await request()
      signal.throwIfAborted()
      if (response.status === TOO_MANY_REQUESTS) return { kind: RATE_LIMITED }
    }
    if (response.status === UNAUTHORIZED) return { kind: INVALID_TOKEN }
    if (response.status === FORBIDDEN) return { kind: INVALID_INSTANCE }
    if (response.status >= SERVER_ERROR_START)
      return { kind: SERVICE_UNAVAILABLE }
    const body = await response.text()
    signal.throwIfAborted()
    if (response.status === BAD_REQUEST) return classifyBadRequest(body)
    if (response.status !== OK) return { kind: INVALID_UPSTREAM_RESPONSE }
    let value: unknown
    try {
      value = JSON.parse(body)
    } catch {
      return { kind: INVALID_UPSTREAM_RESPONSE }
    }
    const chats = normalizeChats({ value, credentials })
    return chats === null
      ? { kind: INVALID_UPSTREAM_RESPONSE }
      : { kind: RESPONSE_OK, chats }
  } catch {
    return { kind: SERVICE_UNAVAILABLE }
  }
}
