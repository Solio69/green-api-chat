import { setTimeout as wait } from 'node:timers/promises'
import { classifyBadRequest } from './get-state'
import { normalizeHistory } from '@/lib/history/normalize-history'
import type { GetHistoryOptions, GetHistoryResult } from '@/lib/history/types'
import { API_ERROR_CODE, API_RESPONSE_STATUS } from '@/lib/api/constants'
import { HISTORY_CONFIG } from '@/lib/history/constants'
import {
  CACHE_CONTROL,
  FETCH_REDIRECT,
  HTTP_METHOD,
  HTTP_STATUS,
  HTTP_HEADERS,
  HTTP_CONTENT_TYPE,
} from '@/lib/http/constants'
import { GREEN_API_CONFIG } from './constants'

const {
  HOST,
  INSTANCE_PATH_PREFIX,
  CHAT_HISTORY_METHOD,
  TIMEOUT_MS,
  RATE_LIMIT_RETRY_DELAY_MS,
} = GREEN_API_CONFIG
const { COUNT, INVALID_TARGET_PATTERN } = HISTORY_CONFIG
const {
  INVALID_REQUEST,
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
const { POST } = HTTP_METHOD
const { CONTENT_TYPE } = HTTP_HEADERS
const { JSON: JSON_CONTENT_TYPE } = HTTP_CONTENT_TYPE
const { NO_STORE } = CACHE_CONTROL
const { ERROR: REDIRECT_ERROR } = FETCH_REDIRECT
const waitForRateLimit = ({
  delay,
  signal,
}: {
  delay: number
  signal: AbortSignal
}) => wait(delay, undefined, { signal })

export const getChatHistory = async ({
  credentials,
  chatId,
  signal: callerSignal,
  fetcher = fetch,
  waitForRetry = waitForRateLimit,
}: GetHistoryOptions): Promise<GetHistoryResult> => {
  const id = encodeURIComponent(credentials.idInstance)
  const token = encodeURIComponent(credentials.apiTokenInstance)
  const url = `${HOST}/${INSTANCE_PATH_PREFIX}${id}/${CHAT_HISTORY_METHOD}/${token}`
  const deadline = AbortSignal.timeout(TIMEOUT_MS)
  const signal = callerSignal
    ? AbortSignal.any([callerSignal, deadline])
    : deadline
  try {
    signal.throwIfAborted()
    const request = () =>
      fetcher(url, {
        method: POST,
        cache: NO_STORE,
        redirect: REDIRECT_ERROR,
        signal,
        headers: { [CONTENT_TYPE]: JSON_CONTENT_TYPE },
        body: JSON.stringify({ chatId, count: COUNT }),
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
    if (response.status === BAD_REQUEST) {
      if (INVALID_TARGET_PATTERN.test(body)) return { kind: INVALID_REQUEST }
      return classifyBadRequest(body)
    }
    if (response.status !== OK) return { kind: INVALID_UPSTREAM_RESPONSE }
    let value: unknown
    try {
      value = JSON.parse(body)
    } catch {
      return { kind: INVALID_UPSTREAM_RESPONSE }
    }
    const messages = normalizeHistory({ value, chatId, credentials })
    return messages === null
      ? { kind: INVALID_UPSTREAM_RESPONSE }
      : { kind: RESPONSE_OK, messages }
  } catch {
    return { kind: SERVICE_UNAVAILABLE }
  }
}
