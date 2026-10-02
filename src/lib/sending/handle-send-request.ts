import { readSendBody } from './read-send-body'
import type {
  AcceptedSend,
  ProviderSendResult,
  SendFailure,
  SendRequestOptions,
} from './types'
import { validateSendRequest } from './validate-send-request'
import { API_ERROR_CODE, API_RESPONSE_STATUS } from '@/lib/api/constants'
import { CHAT_QUERY_CONFIG } from '@/lib/chats/constants'
import {
  CACHE_CONTROL,
  HTTP_HEADERS,
  HTTP_STATUS,
  HTTP_URL_PROTOCOL,
} from '@/lib/http/constants'
import { EMPTY_STRING } from '@/lib/ui/constants'
import { SEND_CONFIG, SEND_OUTCOME } from './constants'

const {
  INVALID_REQUEST,
  SESSION_REQUIRED,
  CONNECTION_CHANGED,
  SERVER_UNAVAILABLE,
  SERVICE_UNAVAILABLE,
  INVALID_TOKEN,
  INVALID_INSTANCE,
  NEEDS_AUTHORIZATION,
  INSTANCE_RESTRICTED,
  INSTANCE_EXPIRED,
  UPSTREAM_REJECTED,
  RATE_LIMITED,
  OUTCOME_UNKNOWN,
} = API_ERROR_CODE
const { OK: RESPONSE_OK, ERROR: RESPONSE_ERROR } = API_RESPONSE_STATUS
const {
  OK,
  BAD_REQUEST,
  UNAUTHORIZED,
  FORBIDDEN,
  CONFLICT,
  PAYLOAD_TOO_LARGE,
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
const { NO_STORE } = CACHE_CONTROL
const { SCOPE_PATTERN } = CHAT_QUERY_CONFIG
const { ROOT_PATH, INVALID_HOST_PARTS } = SEND_CONFIG
const { NOT_SENT, UNKNOWN } = SEND_OUTCOME

const jsonResponse = ({
  body,
  status,
}: {
  body: AcceptedSend | SendFailure
  status: number
}) => Response.json(body, { status, headers: { [CACHE_HEADER]: NO_STORE } })
const errorResponse = ({
  code,
  status,
  outcome = NOT_SENT,
}: {
  code: SendFailure['code']
  status: number
  outcome?: SendFailure['outcome']
}) => jsonResponse({ body: { status: RESPONSE_ERROR, code, outcome }, status })
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
const isConfirmedRefusal = (result: ProviderSendResult) =>
  result.kind !== RESPONSE_OK && result.kind !== OUTCOME_UNKNOWN
const isAccessDenied = (result: ProviderSendResult) =>
  result.kind === INVALID_TOKEN ||
  result.kind === INVALID_INSTANCE ||
  result.kind === NEEDS_AUTHORIZATION ||
  result.kind === INSTANCE_RESTRICTED ||
  result.kind === INSTANCE_EXPIRED

export const handleSendRequest = async ({
  request,
  context,
  send,
  clearSession,
  tryAcquireSend,
}: SendRequestOptions): Promise<Response> => {
  if (!isSameOrigin(request))
    return errorResponse({ code: INVALID_REQUEST, status: FORBIDDEN })
  if (!context.configured)
    return errorResponse({ code: SERVER_UNAVAILABLE, status: HTTP_UNAVAILABLE })
  let release: (() => void) | undefined
  let outcome: SendFailure['outcome'] = NOT_SENT
  let response: Response
  try {
    const { credentials, connectionScope, ownerCapability } = context
    if (!credentials) {
      await clearSession()
      return errorResponse({ code: SESSION_REQUIRED, status: UNAUTHORIZED })
    }
    const scope = request.headers.get(CONNECTION_SCOPE)
    const validScope = scope !== null && SCOPE_PATTERN.test(scope)
    if (!validScope)
      return errorResponse({ code: INVALID_REQUEST, status: BAD_REQUEST })
    if (scope !== connectionScope)
      return errorResponse({ code: CONNECTION_CHANGED, status: CONFLICT })
    const body = await readSendBody(request)
    if (body.kind !== RESPONSE_OK)
      return errorResponse({
        code: INVALID_REQUEST,
        status: body.kind === INVALID_REQUEST ? BAD_REQUEST : PAYLOAD_TOO_LARGE,
      })
    const input = validateSendRequest({ value: body.value, credentials })
    if (!input)
      return errorResponse({ code: INVALID_REQUEST, status: BAD_REQUEST })
    const lease = tryAcquireSend({
      credentials,
      connectionScope: scope,
      ownerCapability: ownerCapability ?? EMPTY_STRING,
      attemptId: input.attemptId,
    })
    if (lease.kind !== RESPONSE_OK)
      return errorResponse({ code: lease.kind, status: CONFLICT })
    release = lease.release
    request.signal.throwIfAborted()
    outcome = UNKNOWN
    const result = await send({
      credentials,
      chatId: input.chatId,
      message: input.message,
    })
    if (isConfirmedRefusal(result)) outcome = NOT_SENT
    if (result.kind === RESPONSE_OK) {
      response = jsonResponse({
        body: {
          status: RESPONSE_OK,
          connectionScope: scope,
          chatId: input.chatId,
          attemptId: input.attemptId,
          idMessage: result.idMessage,
        },
        status: OK,
      })
    } else if (isAccessDenied(result)) {
      await clearSession()
      response = errorResponse({ code: SESSION_REQUIRED, status: UNAUTHORIZED })
    } else if (result.kind === UPSTREAM_REJECTED) {
      response = errorResponse({ code: UPSTREAM_REJECTED, status: BAD_REQUEST })
    } else if (result.kind === RATE_LIMITED) {
      response = errorResponse({
        code: RATE_LIMITED,
        status: TOO_MANY_REQUESTS,
      })
    } else {
      response = errorResponse({
        code: OUTCOME_UNKNOWN,
        status: BAD_GATEWAY,
        outcome: UNKNOWN,
      })
    }
  } catch {
    response =
      outcome === UNKNOWN
        ? errorResponse({
            code: OUTCOME_UNKNOWN,
            status: BAD_GATEWAY,
            outcome: UNKNOWN,
          })
        : errorResponse({ code: SERVICE_UNAVAILABLE, status: HTTP_UNAVAILABLE })
  } finally {
    // Cleanup cannot erase accepted data or turn uncertainty into a proven refusal.
    try {
      release?.()
    } catch {
      /* The shared registry still owns the failed lease. */
    }
  }
  return response
}
