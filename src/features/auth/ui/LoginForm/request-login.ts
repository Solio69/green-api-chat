import { isRecord } from '@/lib/api/is-record'
import { API_ERROR_CODE, API_RESPONSE_STATUS } from '@/lib/api/constants'
import {
  CACHE_CONTROL,
  HTTP_CONTENT_TYPE,
  HTTP_HEADERS,
  HTTP_METHOD,
  HTTP_STATUS,
} from '@/lib/http/constants'
import { ROUTES } from '@/lib/routes/constants'
import { LOGIN_ERROR_COPY } from './constants'

const { INVALID_UPSTREAM_RESPONSE, SERVICE_UNAVAILABLE } = API_ERROR_CODE
const { OK: RESPONSE_OK, ERROR: RESPONSE_ERROR } = API_RESPONSE_STATUS
const { OK: HTTP_OK } = HTTP_STATUS
const { CONTENT_TYPE } = HTTP_HEADERS
const { POST: HTTP_POST } = HTTP_METHOD
const { JSON: JSON_CONTENT_TYPE } = HTTP_CONTENT_TYPE
const { NO_STORE } = CACHE_CONTROL
const { LOGIN_API } = ROUTES

export type LoginErrorCode = keyof typeof LOGIN_ERROR_COPY
export type LoginCredentials = {
  idInstance: string
  apiTokenInstance: string
}
export type LoginRequestResult =
  { kind: 'success' } | { kind: 'error'; code: LoginErrorCode }

const isLoginErrorCode = (value: unknown): value is LoginErrorCode =>
  typeof value === 'string' && Object.hasOwn(LOGIN_ERROR_COPY, value)

const readErrorCode = (value: unknown): LoginErrorCode | null => {
  if (!isRecord(value)) return null
  const { status, code } = value
  const isKnownError = status === RESPONSE_ERROR && isLoginErrorCode(code)
  return isKnownError ? code : null
}

export const requestLogin = async ({
  credentials,
  signal,
  fetcher = fetch,
}: {
  credentials: LoginCredentials
  signal: AbortSignal
  fetcher?: typeof fetch
}): Promise<LoginRequestResult> => {
  let response: Response
  try {
    response = await fetcher(LOGIN_API, {
      method: HTTP_POST,
      headers: { [CONTENT_TYPE]: JSON_CONTENT_TYPE },
      body: JSON.stringify(credentials),
      cache: NO_STORE,
      signal,
    })
  } catch {
    return { kind: 'error', code: SERVICE_UNAVAILABLE }
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    return { kind: 'error', code: INVALID_UPSTREAM_RESPONSE }
  }

  const confirmed =
    response.status === HTTP_OK &&
    isRecord(payload) &&
    payload.status === RESPONSE_OK
  if (confirmed) return { kind: 'success' }
  return {
    kind: 'error',
    code: readErrorCode(payload) ?? INVALID_UPSTREAM_RESPONSE,
  }
}
