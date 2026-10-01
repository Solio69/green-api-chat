import { API_ERROR_CODE } from '@/lib/api/constants'
import {
  CACHE_CONTROL,
  FETCH_REDIRECT,
  HTTP_CONTENT_TYPE,
  HTTP_HEADERS,
  HTTP_METHOD,
  HTTP_STATUS,
} from '@/lib/http/constants'
import { RECIPIENT_RESULT_KIND } from '@/lib/recipients/constants'
import type { RecipientQuery } from '@/lib/recipients/validate-search'
import { GREEN_API_BAD_REQUEST, GREEN_API_CONFIG } from './constants'
import type { InstanceCredentials } from './get-state'

const {
  INVALID_TOKEN,
  RETRY_LATER,
  RATE_LIMITED,
  SERVICE_UNAVAILABLE,
  INVALID_UPSTREAM_RESPONSE,
} = API_ERROR_CODE
const { FOUND, NOT_FOUND } = RECIPIENT_RESULT_KIND
const {
  OK: HTTP_OK,
  BAD_REQUEST: HTTP_BAD_REQUEST,
  UNAUTHORIZED: HTTP_UNAUTHORIZED,
  TOO_MANY_REQUESTS: HTTP_TOO_MANY_REQUESTS,
  PROVIDER_RATE_LIMITED,
  SERVER_ERROR_START,
} = HTTP_STATUS
const { POST: HTTP_POST } = HTTP_METHOD
const { CONTENT_TYPE } = HTTP_HEADERS
const { JSON: JSON_CONTENT_TYPE } = HTTP_CONTENT_TYPE
const { NO_STORE } = CACHE_CONTROL
const { ERROR: REDIRECT_ERROR } = FETCH_REDIRECT
const { HOST, INSTANCE_PATH_PREFIX, CHECK_ACCOUNT_METHOD, TIMEOUT_MS } =
  GREEN_API_CONFIG
const { STARTING, AMBIGUOUS } = GREEN_API_BAD_REQUEST

const CHECK_ACCOUNT_RESPONSE = {
  EXIST: 'exist',
  CHAT_ID: 'chatId',
  STATUS: 'status',
  DATA: 'data',
  REASON: 'reason',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
} as const

const { EXIST, CHAT_ID, STATUS, DATA, REASON, RATE_LIMIT_EXCEEDED } =
  CHECK_ACCOUNT_RESPONSE

export type CheckAccountResult =
  | { kind: typeof FOUND; chatId: string }
  | { kind: typeof NOT_FOUND }
  | {
      kind:
        | typeof INVALID_TOKEN
        | typeof RETRY_LATER
        | typeof RATE_LIMITED
        | typeof SERVICE_UNAVAILABLE
        | typeof INVALID_UPSTREAM_RESPONSE
    }

const classifyBody = (value: unknown): CheckAccountResult => {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return { kind: INVALID_UPSTREAM_RESPONSE }
  const body = value as Record<string, unknown>
  const data = body[DATA]
  if (
    body[STATUS] === false &&
    data &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    (data as Record<string, unknown>)[REASON] === RATE_LIMIT_EXCEEDED
  )
    return { kind: RATE_LIMITED }
  if (body[STATUS] === false) return { kind: INVALID_UPSTREAM_RESPONSE }
  if (body[EXIST] === false) return { kind: NOT_FOUND }
  if (body[EXIST] === true) {
    const chatId = body[CHAT_ID]
    if (typeof chatId === 'string' && chatId.trim().length > 0)
      return { kind: FOUND, chatId }
  }
  return { kind: INVALID_UPSTREAM_RESPONSE }
}

export const checkAccount = async (
  credentials: InstanceCredentials,
  query: RecipientQuery,
  fetcher: typeof fetch = fetch,
): Promise<CheckAccountResult> => {
  const id = encodeURIComponent(credentials.idInstance)
  const token = encodeURIComponent(credentials.apiTokenInstance)
  const url = `${HOST}/${INSTANCE_PATH_PREFIX}${id}/${CHECK_ACCOUNT_METHOD}/${token}`
  try {
    const response = await fetcher(url, {
      method: HTTP_POST,
      headers: { [CONTENT_TYPE]: JSON_CONTENT_TYPE },
      body: JSON.stringify(query),
      cache: NO_STORE,
      redirect: REDIRECT_ERROR,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (
      response.status === HTTP_TOO_MANY_REQUESTS ||
      response.status === PROVIDER_RATE_LIMITED
    )
      return { kind: RATE_LIMITED }
    if (response.status === HTTP_UNAUTHORIZED) return { kind: INVALID_TOKEN }
    if (response.status >= SERVER_ERROR_START)
      return { kind: SERVICE_UNAVAILABLE }
    if (response.status === HTTP_BAD_REQUEST) {
      const detail = (await response.text()).toLowerCase()
      if (detail.includes(STARTING) || detail.includes(AMBIGUOUS))
        return { kind: RETRY_LATER }
      return { kind: INVALID_UPSTREAM_RESPONSE }
    }
    if (response.status !== HTTP_OK) return { kind: INVALID_UPSTREAM_RESPONSE }
    try {
      return classifyBody(await response.json())
    } catch {
      return { kind: INVALID_UPSTREAM_RESPONSE }
    }
  } catch {
    return { kind: SERVICE_UNAVAILABLE }
  }
}
