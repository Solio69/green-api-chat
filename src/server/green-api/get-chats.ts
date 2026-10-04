import { setTimeout as wait } from 'node:timers/promises'
import type { GetChatsOptions, GetChatsResult } from './get-chats.types'
import { classifyBadRequest } from './get-state'
import { fetchGreenApi } from './transport'
import { normalizeChats } from '@/features/chats/model'
import {
  API_ERROR_CODE,
  API_RESPONSE_STATUS,
} from '@/shared/kernel/api/constants'
import { HTTP_METHOD, HTTP_STATUS } from '@/shared/kernel/http/constants'
import { GREEN_API_CONFIG } from './constants'

const { CHATS_METHOD, TIMEOUT_MS, RATE_LIMIT_RETRY_DELAY_MS } = GREEN_API_CONFIG
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
  const deadline = AbortSignal.timeout(TIMEOUT_MS)
  const signal = callerSignal
    ? AbortSignal.any([callerSignal, deadline])
    : deadline
  try {
    signal.throwIfAborted()
    const request = () =>
      fetchGreenApi({
        credentials,
        methodName: CHATS_METHOD,
        method: GET,
        signal,
        fetcher,
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
