import type { ChatsErrorCode } from '@/features/chats/model'
import { validateHistoryRequest } from '@/features/conversation/history/model'
import type {
  GetHistoryOptions,
  GetHistoryResult,
} from '@/server/green-api/get-chat-history.types'
import {
  isSameOrigin,
  jsonNoStore,
  readConnectionScope,
  readUnboundedJsonBody,
} from '@/server/http'
import type { InstanceCredentials } from '@/shared/kernel/api/instance-credentials'
import {
  API_ERROR_CODE,
  API_RESPONSE_STATUS,
} from '@/shared/kernel/api/constants'
import { HTTP_STATUS } from '@/shared/kernel/http/constants'

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
const errorResponse = ({
  code,
  status,
}: {
  code: ChatsErrorCode
  status: number
}) => jsonNoStore({ body: { status: RESPONSE_ERROR, code }, status })
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
    const scope = readConnectionScope(request)
    if (scope === null)
      return errorResponse({ code: INVALID_REQUEST, status: BAD_REQUEST })
    if (scope !== context.connectionScope)
      return errorResponse({ code: CONNECTION_CHANGED, status: CONFLICT })
    if (!isSameOrigin(request))
      return errorResponse({ code: INVALID_REQUEST, status: FORBIDDEN })
    const body = await readUnboundedJsonBody(request)
    if (body.kind !== 'ok')
      return errorResponse({ code: INVALID_REQUEST, status: BAD_REQUEST })
    const input = validateHistoryRequest(body.value)
    if (!input)
      return errorResponse({ code: INVALID_REQUEST, status: BAD_REQUEST })
    const result = await lookup({
      credentials: context.credentials,
      chatId: input.chatId,
      signal: request.signal,
    })
    if (result.kind === RESPONSE_OK)
      return jsonNoStore({
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
