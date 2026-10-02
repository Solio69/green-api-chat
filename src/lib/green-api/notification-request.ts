import { classifyBadRequest } from './get-state'
import { ReceiverError } from '@/lib/notifications/receiver-registry'
import type { ReceiverContext } from '@/lib/notifications/types'
import { API_ERROR_CODE } from '@/lib/api/constants'
import {
  CACHE_CONTROL,
  FETCH_REDIRECT,
  HTTP_METHOD,
  HTTP_HEADERS,
  HTTP_STATUS,
} from '@/lib/http/constants'
import {
  NOTIFICATION_CONFIG,
  NOTIFICATION_CODE,
} from '@/lib/notifications/constants'
import { EMPTY_STRING } from '@/lib/ui/constants'
import { GREEN_API_CONFIG } from './constants'

const { GET } = HTTP_METHOD
const { NO_STORE } = CACHE_CONTROL
const { ERROR } = FETCH_REDIRECT
const { SESSION_REQUIRED, INSTANCE_EXPIRED, RETRY_LATER } = API_ERROR_CODE
const {
  RETRY_LATER: RECEIVER_RETRY_LATER,
  NOT_CONFIGURED,
  INVALID_UPSTREAM,
} = NOTIFICATION_CODE
const { RETRY_AFTER } = HTTP_HEADERS

const { HOST, INSTANCE_PATH_PREFIX } = GREEN_API_CONFIG
const { TIMEOUT_MS } = NOTIFICATION_CONFIG
const { OK, UNAUTHORIZED, FORBIDDEN, BAD_REQUEST } = HTTP_STATUS
export const notificationRequest = async ({
  context,
  methodName,
  method = GET,
  suffix = EMPTY_STRING,
  signal,
  fetcher = fetch,
}: {
  context: ReceiverContext
  methodName: string
  method?: string
  suffix?: string
  signal?: AbortSignal
  fetcher?: typeof fetch
}): Promise<unknown> => {
  const { idInstance, apiTokenInstance } = context.credentials
  const url = `${HOST}/${INSTANCE_PATH_PREFIX}${encodeURIComponent(idInstance)}/${methodName}/${encodeURIComponent(apiTokenInstance)}${suffix}`
  const timeout = AbortSignal.timeout(TIMEOUT_MS)
  const response = await fetcher(url, {
    method,
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    cache: NO_STORE,
    redirect: ERROR,
  })
  const authFailure =
    response.status === UNAUTHORIZED || response.status === FORBIDDEN
  if (authFailure) throw new ReceiverError({ code: SESSION_REQUIRED })
  if (response.status === BAD_REQUEST) {
    const refusal = classifyBadRequest(await response.text())
    if (refusal.kind === INSTANCE_EXPIRED)
      throw new ReceiverError({ code: SESSION_REQUIRED })
    if (refusal.kind === RETRY_LATER)
      throw new ReceiverError({ code: RECEIVER_RETRY_LATER })
    throw new ReceiverError({ code: NOT_CONFIGURED })
  }
  if (response.status !== OK) {
    const retryHeader = response.headers.get(RETRY_AFTER)
    const retrySeconds = retryHeader === null ? NaN : Number(retryHeader)
    const retryDate = retryHeader === null ? NaN : Date.parse(retryHeader)
    let retryAfterMs = 0
    if (Number.isFinite(retrySeconds))
      retryAfterMs = Math.max(0, retrySeconds * 1_000)
    else if (Number.isFinite(retryDate))
      retryAfterMs = Math.max(0, retryDate - Date.now())
    throw new ReceiverError({
      code: RECEIVER_RETRY_LATER,
      retryAfterMs,
    })
  }
  const text = await response.text()
  if (text.trim() === EMPTY_STRING) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new ReceiverError({ code: INVALID_UPSTREAM })
  }
}
