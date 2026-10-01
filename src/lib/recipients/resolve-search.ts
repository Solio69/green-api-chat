import { API_ERROR_CODE, API_RESPONSE_STATUS } from '@/lib/api/constants'
import type { CheckAccountResult } from '@/lib/green-api/check-account'
import { CACHE_CONTROL, HTTP_HEADERS, HTTP_STATUS } from '@/lib/http/constants'
import { RECIPIENT_RESULT_KIND } from './constants'

const {
  SESSION_REQUIRED,
  INVALID_TOKEN,
  RETRY_LATER,
  RATE_LIMITED,
  SERVICE_UNAVAILABLE,
  INVALID_UPSTREAM_RESPONSE,
} = API_ERROR_CODE
const { OK: RESPONSE_OK, ERROR: RESPONSE_ERROR } = API_RESPONSE_STATUS
const { FOUND, NOT_FOUND } = RECIPIENT_RESULT_KIND
const {
  OK: HTTP_OK,
  UNAUTHORIZED: HTTP_UNAUTHORIZED,
  TOO_MANY_REQUESTS: HTTP_TOO_MANY_REQUESTS,
  BAD_GATEWAY: HTTP_BAD_GATEWAY,
  SERVICE_UNAVAILABLE: HTTP_SERVICE_UNAVAILABLE,
} = HTTP_STATUS
const { CACHE_CONTROL: CACHE_CONTROL_HEADER } = HTTP_HEADERS
const { NO_STORE } = CACHE_CONTROL

type SearchErrorCode =
  | typeof API_ERROR_CODE.INVALID_REQUEST
  | typeof SESSION_REQUIRED
  | typeof RETRY_LATER
  | typeof RATE_LIMITED
  | typeof SERVICE_UNAVAILABLE
  | typeof INVALID_UPSTREAM_RESPONSE
  | typeof API_ERROR_CODE.SERVER_UNAVAILABLE

const jsonResponse = (body: object, status: number): Response =>
  Response.json(body, {
    status,
    headers: { [CACHE_CONTROL_HEADER]: NO_STORE },
  })

export const searchErrorResponse = (
  code: SearchErrorCode,
  status: number,
): Response => jsonResponse({ status: RESPONSE_ERROR, code }, status)

export const resolveSearchResult = async (
  result: CheckAccountResult,
  clearSession: () => Promise<void>,
): Promise<Response> => {
  if (result.kind === FOUND)
    return jsonResponse(
      { status: RESPONSE_OK, result: FOUND, chatId: result.chatId },
      HTTP_OK,
    )
  if (result.kind === NOT_FOUND)
    return jsonResponse({ status: RESPONSE_OK, result: NOT_FOUND }, HTTP_OK)
  if (result.kind === INVALID_TOKEN) {
    await clearSession()
    return searchErrorResponse(SESSION_REQUIRED, HTTP_UNAUTHORIZED)
  }
  if (result.kind === RATE_LIMITED)
    return searchErrorResponse(RATE_LIMITED, HTTP_TOO_MANY_REQUESTS)
  if (result.kind === INVALID_UPSTREAM_RESPONSE)
    return searchErrorResponse(INVALID_UPSTREAM_RESPONSE, HTTP_BAD_GATEWAY)
  if (result.kind === RETRY_LATER)
    return searchErrorResponse(RETRY_LATER, HTTP_SERVICE_UNAVAILABLE)
  return searchErrorResponse(SERVICE_UNAVAILABLE, HTTP_SERVICE_UNAVAILABLE)
}
