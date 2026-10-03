import { readSendBody } from './read-send-body'
import type {
  ProviderSendResult,
  SendFailure,
  SendRequestOptions,
} from './types'
import { validateSendRequest } from './validate-send-request'
import { isSameOrigin, jsonNoStore, readConnectionScope } from '@/server/http'
import { API_ERROR_CODE, API_RESPONSE_STATUS } from '@/lib/api/constants'
import { HTTP_STATUS } from '@/lib/http/constants'
import { SEND_OUTCOME } from './constants'

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
const { NOT_SENT, UNKNOWN } = SEND_OUTCOME

const errorResponse = ({
  code,
  status,
  outcome = NOT_SENT,
}: {
  code: SendFailure['code']
  status: number
  outcome?: SendFailure['outcome']
}) => jsonNoStore({ body: { status: RESPONSE_ERROR, code, outcome }, status })
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
}: SendRequestOptions): Promise<Response> => {
  if (!isSameOrigin(request))
    return errorResponse({ code: INVALID_REQUEST, status: FORBIDDEN })
  if (!context.configured)
    return errorResponse({ code: SERVER_UNAVAILABLE, status: HTTP_UNAVAILABLE })
  let outcome: SendFailure['outcome'] = NOT_SENT
  let response: Response
  try {
    const { credentials, connectionScope } = context
    if (!credentials) {
      await clearSession()
      return errorResponse({ code: SESSION_REQUIRED, status: UNAUTHORIZED })
    }
    const scope = readConnectionScope(request)
    if (scope === null)
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
    request.signal.throwIfAborted()
    outcome = UNKNOWN
    const result = await send({
      credentials,
      chatId: input.chatId,
      message: input.message,
    })
    if (isConfirmedRefusal(result)) outcome = NOT_SENT
    if (result.kind === RESPONSE_OK) {
      response = jsonNoStore({
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
  }
  return response
}
