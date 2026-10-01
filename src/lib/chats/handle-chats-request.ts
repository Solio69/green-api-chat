import type { GetChatsOptions, GetChatsResult, ChatsErrorCode } from './types'
import type { InstanceCredentials } from '@/lib/green-api/get-state'
import { API_ERROR_CODE, API_RESPONSE_STATUS } from '@/lib/api/constants'
import { CACHE_CONTROL, HTTP_HEADERS, HTTP_STATUS } from '@/lib/http/constants'
import { CHAT_QUERY_CONFIG } from './constants'

const {
  INVALID_REQUEST,
  SESSION_REQUIRED,
  INVALID_TOKEN,
  INVALID_INSTANCE,
  NEEDS_AUTHORIZATION,
  INSTANCE_RESTRICTED,
  INSTANCE_EXPIRED,
  CONNECTION_CHANGED,
  SERVER_UNAVAILABLE,
  SERVICE_UNAVAILABLE,
  RETRY_LATER,
  RATE_LIMITED,
  INVALID_UPSTREAM_RESPONSE,
} = API_ERROR_CODE
const { OK: RESPONSE_OK, ERROR: RESPONSE_ERROR } = API_RESPONSE_STATUS
const {
  OK,
  BAD_REQUEST,
  UNAUTHORIZED,
  CONFLICT,
  TOO_MANY_REQUESTS,
  BAD_GATEWAY,
  SERVICE_UNAVAILABLE: HTTP_UNAVAILABLE,
} = HTTP_STATUS
const { CACHE_CONTROL: CACHE_HEADER, CONNECTION_SCOPE } = HTTP_HEADERS
const { NO_STORE } = CACHE_CONTROL
const { SCOPE_PATTERN } = CHAT_QUERY_CONFIG
export type ChatsRequestOptions = {
  request: Request
  context: {
    configured: boolean
    credentials: InstanceCredentials | null
    connectionScope: string | null
  }
  lookup: (options: GetChatsOptions) => Promise<GetChatsResult>
  clearSession: () => Promise<void>
}
const jsonResponse = ({ body, status }: { body: object; status: number }) =>
  Response.json(body, { status, headers: { [CACHE_HEADER]: NO_STORE } })
const errorResponse = ({
  code,
  status,
}: {
  code: ChatsErrorCode
  status: number
}) => jsonResponse({ body: { status: RESPONSE_ERROR, code }, status })
export const handleChatsRequest = async ({
  request,
  context,
  lookup,
  clearSession,
}: ChatsRequestOptions): Promise<Response> => {
  if (!context.configured)
    return errorResponse({ code: SERVER_UNAVAILABLE, status: HTTP_UNAVAILABLE })
  try {
    if (!context.credentials) {
      await clearSession()
      return errorResponse({ code: SESSION_REQUIRED, status: UNAUTHORIZED })
    }
    const scope = request.headers.get(CONNECTION_SCOPE)
    const isValidScope = scope !== null && SCOPE_PATTERN.test(scope)
    if (!isValidScope)
      return errorResponse({ code: INVALID_REQUEST, status: BAD_REQUEST })
    if (scope !== context.connectionScope)
      return errorResponse({ code: CONNECTION_CHANGED, status: CONFLICT })
    const result = await lookup({
      credentials: context.credentials,
      signal: request.signal,
    })
    if (result.kind === RESPONSE_OK)
      return jsonResponse({
        body: {
          status: RESPONSE_OK,
          connectionScope: scope,
          chats: result.chats,
        },
        status: OK,
      })
    const isAccessDenied =
      result.kind === INVALID_TOKEN ||
      result.kind === INVALID_INSTANCE ||
      result.kind === NEEDS_AUTHORIZATION ||
      result.kind === INSTANCE_RESTRICTED ||
      result.kind === INSTANCE_EXPIRED
    if (isAccessDenied) {
      await clearSession()
      return errorResponse({ code: SESSION_REQUIRED, status: UNAUTHORIZED })
    }
    if (result.kind === RATE_LIMITED)
      return errorResponse({ code: RATE_LIMITED, status: TOO_MANY_REQUESTS })
    if (result.kind === INVALID_UPSTREAM_RESPONSE)
      return errorResponse({
        code: INVALID_UPSTREAM_RESPONSE,
        status: BAD_GATEWAY,
      })
    if (result.kind === RETRY_LATER)
      return errorResponse({ code: RETRY_LATER, status: HTTP_UNAVAILABLE })
    return errorResponse({
      code: SERVICE_UNAVAILABLE,
      status: HTTP_UNAVAILABLE,
    })
  } catch {
    return errorResponse({
      code: SERVICE_UNAVAILABLE,
      status: HTTP_UNAVAILABLE,
    })
  }
}
