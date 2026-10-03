import { createAckProof, verifyAckProof } from './ack-proof'
import { normalizeNotification } from './normalize-notification'
import { ReceiverError } from './receiver-error'
import type { ReceiverContext, ReceiverProvider } from './types'
import { isRecord } from '@/lib/api/is-record'
import { isChatId } from '@/lib/chats/validate-chat-id'
import { hasSessionPassword } from '@/server/session'
import { API_ERROR_CODE, API_RESPONSE_STATUS } from '@/lib/api/constants'
import { CHAT_QUERY_CONFIG } from '@/lib/chats/constants'
import {
  CACHE_CONTROL,
  HTTP_BODY_LIMIT,
  HTTP_CONTENT_TYPE,
  HTTP_SYNTAX,
  HTTP_HEADERS,
  HTTP_METHOD,
  HTTP_STATUS,
  HTTP_URL_PROTOCOL,
  TEXT_ENCODING,
} from '@/lib/http/constants'
import { SEND_CONFIG } from '@/lib/sending/constants'
import { EMPTY_STRING } from '@/lib/ui/constants'
import {
  NOTIFICATION_ACTION,
  NOTIFICATION_CONFIG,
  NOTIFICATION_CODE,
} from './constants'

const {
  CACHE_CONTROL: HEADER_CACHE_CONTROL,
  ORIGIN,
  HOST,
  CONTENT_TYPE,
  CONTENT_LENGTH,
  CONNECTION_SCOPE,
  RETRY_AFTER,
} = HTTP_HEADERS
const { CONTENT_TYPE_PARAMETER_SEPARATOR } = HTTP_SYNTAX
const { SETTINGS, RECEIVE, ACK } = NOTIFICATION_ACTION
const { NO_STORE } = CACHE_CONTROL
const { ERROR, OK: RESPONSE_OK } = API_RESPONSE_STATUS
const { HTTP, HTTPS } = HTTP_URL_PROTOCOL
const { ROOT_PATH, INVALID_HOST_PARTS } = SEND_CONFIG
const { JSON: JSON_CONTENT_TYPE } = HTTP_CONTENT_TYPE
const { MAX_REQUEST_BYTES } = HTTP_BODY_LIMIT
const { UTF_8 } = TEXT_ENCODING
const { POST } = HTTP_METHOD
const { SERVER_UNAVAILABLE } = API_ERROR_CODE
const { TIMEOUT_MS } = NOTIFICATION_CONFIG
const { SCOPE_PATTERN } = CHAT_QUERY_CONFIG
const { DELIVERY_CHANGED, RETRY_LATER, INVALID_UPSTREAM } = NOTIFICATION_CODE

export type NotificationRequestOptions = {
  request: Request
  action: (typeof NOTIFICATION_ACTION)[keyof typeof NOTIFICATION_ACTION]
  context: ReceiverContext | null
  configured: boolean
  provider: ReceiverProvider
  password: string | undefined
  clearSession: () => Promise<void>
}
const {
  OK,
  BAD_REQUEST,
  FORBIDDEN,
  UNAUTHORIZED,
  CONFLICT,
  METHOD_NOT_ALLOWED,
  SERVICE_UNAVAILABLE,
  BAD_GATEWAY,
} = HTTP_STATUS
const { INVALID_REQUEST, CONNECTION_CHANGED, SESSION_REQUIRED } = API_ERROR_CODE
const json = ({ body, status = OK }: { body: object; status?: number }) =>
  Response.json(body, {
    status,
    headers: { [HEADER_CACHE_CONTROL]: NO_STORE },
  })
const failure = ({
  code,
  status = CONFLICT,
}: {
  code: string
  status?: number
}) => json({ body: { status: ERROR, code }, status })
export const isNotificationOrigin = (request: Request) => {
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
    return source.origin === new URL(`${requestUrl.protocol}//${host}`).origin
  } catch {
    return false
  }
}
const readBody = async (request: Request): Promise<unknown> => {
  const type = request.headers
    .get(CONTENT_TYPE)
    ?.split(CONTENT_TYPE_PARAMETER_SEPARATOR)[0]
    .trim()
    .toLowerCase()
  if (type !== JSON_CONTENT_TYPE) return null
  const length = request.headers.get(CONTENT_LENGTH)
  const invalidLength =
    length !== null &&
    (!/^\d+$/.test(length) || Number(length) > MAX_REQUEST_BYTES)
  if (invalidLength) return null
  const reader = request.body?.getReader()
  if (!reader) return null
  const decoder = new TextDecoder(UTF_8, { fatal: true })
  let bytes = 0
  let text = EMPTY_STRING
  try {
    while (true) {
      const chunk = await reader.read()
      if (chunk.done) break
      bytes += chunk.value.byteLength
      if (bytes > MAX_REQUEST_BYTES) {
        await reader.cancel().catch(() => undefined)
        return null
      }
      text += decoder.decode(chunk.value, { stream: true })
    }
    return JSON.parse(text + decoder.decode()) as unknown
  } catch {
    await reader.cancel().catch(() => undefined)
    return null
  } finally {
    reader.releaseLock()
  }
}
export const handleNotificationRequest = async ({
  request,
  action,
  context,
  configured,
  provider,
  password,
  clearSession,
}: NotificationRequestOptions): Promise<Response> => {
  if (request.method !== POST)
    return failure({ code: INVALID_REQUEST, status: METHOD_NOT_ALLOWED })
  if (!isNotificationOrigin(request))
    return failure({ code: INVALID_REQUEST, status: FORBIDDEN })
  const available = configured && hasSessionPassword(password)
  if (!available)
    return failure({ code: SERVER_UNAVAILABLE, status: SERVICE_UNAVAILABLE })
  if (!context) {
    await clearSession()
    return failure({ code: SESSION_REQUIRED, status: UNAUTHORIZED })
  }
  const scope = request.headers.get(CONNECTION_SCOPE)
  const validScope = scope !== null && SCOPE_PATTERN.test(scope)
  if (!validScope)
    return failure({ code: INVALID_REQUEST, status: BAD_REQUEST })
  if (scope !== context.connectionScope)
    return failure({ code: CONNECTION_CHANGED })
  const body = await readBody(request)
  if (!isRecord(body))
    return failure({ code: INVALID_REQUEST, status: BAD_REQUEST })
  const keys = Object.keys(body)
  const settingsBody = action === SETTINGS && keys.length === 0
  const receiveBody =
    action === RECEIVE &&
    keys.length === 1 &&
    keys[0] === 'ownerEpoch' &&
    isChatId(body.ownerEpoch)
  const ackBody =
    action === ACK &&
    keys.length === 1 &&
    keys[0] === 'ackToken' &&
    typeof body.ackToken === 'string'
  const validBody = settingsBody || receiveBody || ackBody
  if (!validBody) return failure({ code: INVALID_REQUEST, status: BAD_REQUEST })
  const signal = AbortSignal.any([
    request.signal,
    AbortSignal.timeout(action === ACK ? TIMEOUT_MS * 2 : TIMEOUT_MS),
  ])
  const success = (extra: object) =>
    json({ body: { status: RESPONSE_OK, connectionScope: scope, ...extra } })
  try {
    signal.throwIfAborted()
    if (action === SETTINGS) {
      const settings = await provider.settings(context)
      signal.throwIfAborted()
      return success(settings)
    }
    if (action === RECEIVE) {
      const value = await provider.receive({ context, signal })
      signal.throwIfAborted()
      if (value === null) return success({ delivery: null, ackToken: null })
      const receipt = normalizeNotification({
        value,
        credentials: context.credentials,
      })
      if (!receipt)
        return failure({ code: INVALID_UPSTREAM, status: BAD_GATEWAY })
      const ackToken = createAckProof({
        context,
        receiptId: receipt.receiptId,
        password,
      })
      return success({
        ackToken,
        delivery: {
          connectionScope: scope,
          ownerEpoch: body.ownerEpoch,
          deliveryId: ackToken,
          event: receipt.event,
        },
      })
    }
    const ackToken = body.ackToken as string
    const receiptId = verifyAckProof({ token: ackToken, context, password })
    if (receiptId === null) return failure({ code: DELIVERY_CHANGED })
    const deleted = await provider.delete({ context, receiptId, signal })
    signal.throwIfAborted()
    if (!deleted) {
      const value = await provider.receive({ context, signal })
      signal.throwIfAborted()
      if (value !== null) {
        const head = normalizeNotification({
          value,
          credentials: context.credentials,
        })
        if (!head)
          return failure({ code: INVALID_UPSTREAM, status: BAD_GATEWAY })
        if (head.receiptId === receiptId)
          return failure({ code: RETRY_LATER, status: SERVICE_UNAVAILABLE })
      }
    }
    return success({ deliveryId: ackToken })
  } catch (error) {
    if (error instanceof ReceiverError) {
      if (error.code === SESSION_REQUIRED) {
        await clearSession()
        return failure({ code: SESSION_REQUIRED, status: UNAUTHORIZED })
      }
      const status =
        error.code === INVALID_UPSTREAM ? BAD_GATEWAY : SERVICE_UNAVAILABLE
      const response = failure({ code: error.code, status })
      if (error.retryAfterMs > 0)
        response.headers.set(
          RETRY_AFTER,
          String(Math.ceil(error.retryAfterMs / 1_000)),
        )
      return response
    }
    return failure({ code: RETRY_LATER, status: SERVICE_UNAVAILABLE })
  }
}
