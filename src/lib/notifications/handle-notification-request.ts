import { createNotificationStream } from './create-notification-stream'
import type { createReceiverRegistry } from './receiver-registry'
import type { ReceiverContext } from './types'
import { isRecord } from '@/lib/api/is-record'
import { isChatId } from '@/lib/chats/validate-chat-id'
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
  NOTIFICATION_CODE,
  NOTIFICATION_CONFIG,
} from './constants'

const {
  CACHE_CONTROL: HEADER_CACHE_CONTROL,
  ORIGIN,
  HOST,
  CONTENT_TYPE,
  CONTENT_LENGTH,
  CONNECTION_SCOPE,
} = HTTP_HEADERS
const { CONTENT_TYPE_PARAMETER_SEPARATOR } = HTTP_SYNTAX
const { CLAIM, STREAM, ACK, RELEASE } = NOTIFICATION_ACTION
const { NO_STORE } = CACHE_CONTROL
const { ERROR, OK: RESPONSE_OK } = API_RESPONSE_STATUS
const { HTTP, HTTPS } = HTTP_URL_PROTOCOL
const { ROOT_PATH, INVALID_HOST_PARTS } = SEND_CONFIG
const { JSON: JSON_CONTENT_TYPE } = HTTP_CONTENT_TYPE
const { MAX_REQUEST_BYTES } = HTTP_BODY_LIMIT
const { UTF_8 } = TEXT_ENCODING
const { GET, POST } = HTTP_METHOD
const { SERVER_UNAVAILABLE } = API_ERROR_CODE
const { SCOPE_PATTERN } = CHAT_QUERY_CONFIG
const { NOT_OWNER, RETRY_LATER, NOT_CONFIGURED, INVALID_UPSTREAM } =
  NOTIFICATION_CODE

export type NotificationRequestOptions = {
  request: Request
  action: (typeof NOTIFICATION_ACTION)[keyof typeof NOTIFICATION_ACTION]
  context: ReceiverContext | null
  configured: boolean
  registry: ReturnType<typeof createReceiverRegistry>
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
const { OWNER_HEADER, CAPABILITY_PATTERN } = NOTIFICATION_CONFIG
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
  registry,
  clearSession,
}: NotificationRequestOptions): Promise<Response> => {
  const expectedMethod = action === STREAM ? GET : POST
  if (request.method !== expectedMethod)
    return failure({ code: INVALID_REQUEST, status: METHOD_NOT_ALLOWED })
  const invalidOrigin = action !== STREAM && !isNotificationOrigin(request)
  if (invalidOrigin)
    return failure({ code: INVALID_REQUEST, status: FORBIDDEN })
  if (!configured)
    return failure({
      code: SERVER_UNAVAILABLE,
      status: SERVICE_UNAVAILABLE,
    })
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
  const ownerCapability = request.headers.get(OWNER_HEADER)
  const hasProof =
    ownerCapability !== null && CAPABILITY_PATTERN.test(ownerCapability)
  const missingProof = action !== CLAIM && !hasProof
  if (missingProof) return failure({ code: NOT_OWNER })
  const owned = { ...context, ownerCapability: ownerCapability ?? undefined }
  if (action === STREAM) {
    const response = createNotificationStream({
      request,
      context: owned,
      registry,
    })
    return response instanceof Response ? response : failure(response)
  }
  const body = await readBody(request)
  if (!isRecord(body))
    return failure({ code: INVALID_REQUEST, status: BAD_REQUEST })
  const keys = Object.keys(body)
  const validBody =
    action === ACK
      ? keys.length === 1 &&
        keys[0] === 'deliveryId' &&
        isChatId(body.deliveryId)
      : keys.length === 0
  if (!validBody) return failure({ code: INVALID_REQUEST, status: BAD_REQUEST })
  if (request.signal.aborted)
    return failure({
      code: RETRY_LATER,
      status: SERVICE_UNAVAILABLE,
    })
  if (action === CLAIM) {
    const result = await registry.claimOwner(context)
    if (result.kind === RESPONSE_OK)
      return json({
        body: {
          status: RESPONSE_OK,
          connectionScope: scope,
          ownerCapability: result.ownerCapability,
          ownerEpoch: result.ownerEpoch,
          outgoingEnabled: result.outgoingEnabled,
        },
      })
    if (result.code === SESSION_REQUIRED) {
      await clearSession()
      return failure({ code: SESSION_REQUIRED, status: UNAUTHORIZED })
    }
    let status: number = CONFLICT
    const unavailable =
      result.code === NOT_CONFIGURED || result.code === RETRY_LATER
    if (unavailable) status = SERVICE_UNAVAILABLE
    else if (result.code === INVALID_UPSTREAM) status = BAD_GATEWAY
    return failure({ code: result.code, status })
  }
  if (action === RELEASE) {
    registry.releaseOwner(owned)
    return json({
      body: { status: RESPONSE_OK, connectionScope: scope },
    })
  }
  const result = registry.ackDelivery({
    context: owned,
    deliveryId: body.deliveryId as string,
  })
  if (result.kind !== RESPONSE_OK) return failure(result)
  return json({
    body: {
      status: RESPONSE_OK,
      connectionScope: scope,
      deliveryId: body.deliveryId,
    },
  })
}
