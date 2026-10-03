import type { InstanceCredentials } from './get-state'
import { fetchGreenApi } from './transport'
import type { RecipientQuery } from '@/features/recipients/model'
import { RECIPIENT_RESULT_KIND } from '@/features/recipients/model'
import { isRecord } from '@/lib/api/is-record'
import { API_ERROR_CODE } from '@/lib/api/constants'
import { HTTP_METHOD, HTTP_STATUS } from '@/lib/http/constants'
import { GREEN_API_BAD_REQUEST, GREEN_API_CONFIG } from './constants'

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
const { CHECK_ACCOUNT_METHOD, TIMEOUT_MS } = GREEN_API_CONFIG
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
  if (!isRecord(value)) return { kind: INVALID_UPSTREAM_RESPONSE }
  const body = value
  const data = body[DATA]
  const isRateLimited =
    body[STATUS] === false &&
    isRecord(data) &&
    data[REASON] === RATE_LIMIT_EXCEEDED
  if (isRateLimited) return { kind: RATE_LIMITED }
  if (body[STATUS] === false) return { kind: INVALID_UPSTREAM_RESPONSE }
  if (body[EXIST] === false) return { kind: NOT_FOUND }
  if (body[EXIST] === true) {
    const chatId = body[CHAT_ID]
    const isChatId = typeof chatId === 'string' && chatId.trim().length > 0
    if (isChatId) return { kind: FOUND, chatId }
  }
  return { kind: INVALID_UPSTREAM_RESPONSE }
}

export const checkAccount = async ({
  credentials,
  query,
  fetcher = fetch,
}: {
  credentials: InstanceCredentials
  query: RecipientQuery
  fetcher?: typeof fetch
}): Promise<CheckAccountResult> => {
  try {
    const response = await fetchGreenApi({
      credentials,
      methodName: CHECK_ACCOUNT_METHOD,
      method: HTTP_POST,
      jsonBody: query,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      fetcher,
    })
    const isRateLimited =
      response.status === HTTP_TOO_MANY_REQUESTS ||
      response.status === PROVIDER_RATE_LIMITED
    if (isRateLimited) return { kind: RATE_LIMITED }
    if (response.status === HTTP_UNAUTHORIZED) return { kind: INVALID_TOKEN }
    if (response.status >= SERVER_ERROR_START)
      return { kind: SERVICE_UNAVAILABLE }
    if (response.status === HTTP_BAD_REQUEST) {
      const detail = (await response.text()).toLowerCase()
      const isStarting = detail.includes(STARTING) || detail.includes(AMBIGUOUS)
      if (isStarting) return { kind: RETRY_LATER }
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
