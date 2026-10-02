import type { GetHistoryOptions, GetHistoryResult } from './types'
import { validateHistoryRequest } from './validate-history-request'
import type { ChatsErrorCode } from '@/lib/chats/types'
import type { InstanceCredentials } from '@/lib/green-api/get-state'
import { API_ERROR_CODE, API_RESPONSE_STATUS } from '@/lib/api/constants'
import { CHAT_QUERY_CONFIG } from '@/lib/chats/constants'
import {
  CACHE_CONTROL,
  HTTP_HEADERS,
  HTTP_STATUS,
  HTTP_URL_PROTOCOL,
} from '@/lib/http/constants'
import { EMPTY_STRING } from '@/lib/ui/constants'
import { HISTORY_ORIGIN_CONFIG } from './constants'

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
  FORBIDDEN,
  CONFLICT,
  TOO_MANY_REQUESTS,
  BAD_GATEWAY,
  SERVICE_UNAVAILABLE: HTTP_UNAVAILABLE,
} = HTTP_STATUS
const {
  CACHE_CONTROL: CACHE_HEADER,
  CONNECTION_SCOPE,
  ORIGIN,
  HOST,
} = HTTP_HEADERS
const { HTTP, HTTPS } = HTTP_URL_PROTOCOL
const { ROOT_PATH, INVALID_HOST_PARTS } = HISTORY_ORIGIN_CONFIG
const { NO_STORE } = CACHE_CONTROL
const { SCOPE_PATTERN } = CHAT_QUERY_CONFIG

export type HistoryRequestOptions = {
  request: Request
  context: {
    configured: boolean
    credentials: InstanceCredentials | null
    connectionScope: string | null
  }
  lookup: (options: GetHistoryOptions) => Promise<GetHistoryResult>
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
const isSameOrigin = (request: Request) => {
  const origin = request.headers.get(ORIGIN)
  if (origin === null) return false
  try {
    const source = new URL(origin)
    const validSource =
      (source.protocol === HTTP || source.protocol === HTTPS) &&
      source.username === EMPTY_STRING &&
      source.password === EMPTY_STRING &&
      source.pathname === ROOT_PATH &&
      source.search === EMPTY_STRING &&
      source.hash === EMPTY_STRING
    if (!validSource) return false
    const requestUrl = new URL(request.url)
    const host = request.headers.get(HOST)
    if (host === null) return source.origin === requestUrl.origin
    const validHost = host.length > 0 && !INVALID_HOST_PARTS.test(host)
    if (!validHost) return false
    const target = new URL(`${requestUrl.protocol}//${host}`)
    return source.origin === target.origin
  } catch {
    return false
  }
}
export const handleHistoryRequest = async ({
  request,
  context,
  lookup,
  clearSession,
}: HistoryRequestOptions): Promise<Response> => {
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
    if (!isSameOrigin(request))
      return errorResponse({ code: INVALID_REQUEST, status: FORBIDDEN })
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return errorResponse({ code: INVALID_REQUEST, status: BAD_REQUEST })
    }
    const input = validateHistoryRequest(body)
    if (!input)
      return errorResponse({ code: INVALID_REQUEST, status: BAD_REQUEST })
    const result = await lookup({
      credentials: context.credentials,
      chatId: input.chatId,
      signal: request.signal,
    })
    if (result.kind === RESPONSE_OK)
      return jsonResponse({
        body: {
          status: RESPONSE_OK,
          connectionScope: scope,
          chatId: input.chatId,
          messages: result.messages,
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
    if (result.kind === INVALID_REQUEST)
      return errorResponse({ code: INVALID_REQUEST, status: BAD_REQUEST })
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
