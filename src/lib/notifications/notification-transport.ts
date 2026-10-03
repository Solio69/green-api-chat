import { isRecord } from '@/lib/api/is-record'
import type { QuerySession } from '@/lib/query/create-query-session'
import { SessionQueryError } from '@/lib/query/session-query-error'
import { API_ERROR_CODE, API_RESPONSE_STATUS } from '@/lib/api/constants'
import {
  CACHE_CONTROL,
  FETCH_CREDENTIALS,
  HTTP_CONTENT_TYPE,
  HTTP_HEADERS,
  HTTP_METHOD,
  HTTP_STATUS,
} from '@/lib/http/constants'
import { NOTIFICATION_CODE, POLLING_CONFIG } from './constants'

const { POST } = HTTP_METHOD
const { SAME_ORIGIN } = FETCH_CREDENTIALS
const { NO_STORE } = CACHE_CONTROL
const { JSON: JSON_TYPE } = HTTP_CONTENT_TYPE
const { CONNECTION_SCOPE, CONTENT_TYPE, RETRY_AFTER } = HTTP_HEADERS
const { OK: RESPONSE_OK } = API_RESPONSE_STATUS
const { OK, CONFLICT } = HTTP_STATUS
const { CONNECTION_CHANGED } = API_ERROR_CODE
const { INVALID_UPSTREAM, RETRY_LATER } = NOTIFICATION_CODE
const { CLIENT_TIMEOUT_MS } = POLLING_CONFIG
export class NotificationTransportError extends SessionQueryError {
  readonly retryAfterMs: number
  constructor({
    code,
    status,
    retryAfterMs = 0,
  }: {
    code: string
    status: number | null
    retryAfterMs?: number
  }) {
    super({ code, status })
    this.retryAfterMs = retryAfterMs
  }
}
export const createNotificationTransport =
  ({
    session,
    fetcher = fetch,
    now = Date.now,
  }: {
    session: QuerySession
    fetcher?: typeof fetch
    now?: () => number
  }) =>
  async ({
    url,
    body,
    signal,
  }: {
    url: string
    body: object
    signal: AbortSignal
  }) => {
    const response = await fetcher(url, {
      method: POST,
      credentials: SAME_ORIGIN,
      cache: NO_STORE,
      headers: {
        [CONNECTION_SCOPE]: session.connectionScope,
        [CONTENT_TYPE]: JSON_TYPE,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.any([signal, AbortSignal.timeout(CLIENT_TIMEOUT_MS)]),
    })
    let value: unknown
    try {
      value = await response.json()
    } catch {
      throw new NotificationTransportError({
        code: RETRY_LATER,
        status: response.status,
      })
    }
    if (!isRecord(value))
      throw new NotificationTransportError({
        code: INVALID_UPSTREAM,
        status: response.status,
      })
    const rejected = response.status !== OK || value.status !== RESPONSE_OK
    if (rejected) {
      const header = response.headers.get(RETRY_AFTER)
      const seconds = header === null ? NaN : Number(header)
      const date = header === null ? NaN : Date.parse(header)
      let retryAfterMs = 0
      if (Number.isFinite(seconds)) retryAfterMs = Math.max(0, seconds * 1_000)
      else if (Number.isFinite(date)) retryAfterMs = Math.max(0, date - now())
      throw new NotificationTransportError({
        code: typeof value.code === 'string' ? value.code : INVALID_UPSTREAM,
        status: response.status,
        retryAfterMs,
      })
    }
    if (value.connectionScope !== session.connectionScope)
      throw new NotificationTransportError({
        code: CONNECTION_CHANGED,
        status: CONFLICT,
      })
    return value
  }
export const waitForNotificationRetry = ({
  delay,
  signal,
}: {
  delay: number
  signal: AbortSignal
}) =>
  new Promise<void>((resolve) => {
    if (signal.aborted) {
      resolve()
      return
    }
    const finish = () => {
      clearTimeout(timer)
      signal.removeEventListener('abort', finish)
      resolve()
    }
    const timer = setTimeout(finish, delay)
    signal.addEventListener('abort', finish, { once: true })
  })
