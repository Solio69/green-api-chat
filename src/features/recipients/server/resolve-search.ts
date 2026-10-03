import { RECIPIENT_RESULT_KIND } from '@/features/recipients/model'
import type { CheckAccountResult } from '@/lib/green-api/check-account'
import { jsonNoStore } from '@/server/http'
import { API_ERROR_CODE, API_RESPONSE_STATUS } from '@/lib/api/constants'
import { HTTP_STATUS } from '@/lib/http/constants'

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
type SearchErrorCode =
  | typeof API_ERROR_CODE.INVALID_REQUEST
  | typeof SESSION_REQUIRED
  | typeof RETRY_LATER
  | typeof RATE_LIMITED
  | typeof SERVICE_UNAVAILABLE
  | typeof INVALID_UPSTREAM_RESPONSE
  | typeof API_ERROR_CODE.SERVER_UNAVAILABLE

export const searchErrorResponse = ({
  code,
  status,
}: {
  code: SearchErrorCode
  status: number
}): Response => jsonNoStore({ body: { status: RESPONSE_ERROR, code }, status })

export const resolveSearchResult = async ({
  result,
  clearSession,
}: {
  result: CheckAccountResult
  clearSession: () => Promise<void>
}): Promise<Response> => {
  if (result.kind === FOUND)
    return jsonNoStore({
      body: { status: RESPONSE_OK, result: FOUND, chatId: result.chatId },
      status: HTTP_OK,
    })
  if (result.kind === NOT_FOUND)
    return jsonNoStore({
      body: { status: RESPONSE_OK, result: NOT_FOUND },
      status: HTTP_OK,
    })
  if (result.kind === INVALID_TOKEN) {
    await clearSession()
    return searchErrorResponse({
      code: SESSION_REQUIRED,
      status: HTTP_UNAUTHORIZED,
    })
  }
  if (result.kind === RATE_LIMITED)
    return searchErrorResponse({
      code: RATE_LIMITED,
      status: HTTP_TOO_MANY_REQUESTS,
    })
  if (result.kind === INVALID_UPSTREAM_RESPONSE)
    return searchErrorResponse({
      code: INVALID_UPSTREAM_RESPONSE,
      status: HTTP_BAD_GATEWAY,
    })
  if (result.kind === RETRY_LATER)
    return searchErrorResponse({
      code: RETRY_LATER,
      status: HTTP_SERVICE_UNAVAILABLE,
    })
  return searchErrorResponse({
    code: SERVICE_UNAVAILABLE,
    status: HTTP_SERVICE_UNAVAILABLE,
  })
}
