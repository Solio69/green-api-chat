import { createAckProof, verifyAckProof } from './ack-proof'
import { normalizeNotification } from './normalize-notification'
import { ReceiverError } from './receiver-error'
import type { ReceiverContext, ReceiverProvider } from './types'
import { isChatId } from '@/features/chats/model'
import { isRecord } from '@/lib/api/is-record'
import {
  isSameOrigin,
  jsonNoStore,
  readBoundedJsonBody,
  readConnectionScope,
} from '@/server/http'
import { hasSessionPassword } from '@/server/session'
import { API_ERROR_CODE, API_RESPONSE_STATUS } from '@/lib/api/constants'
import {
  HTTP_BODY_LIMIT,
  HTTP_HEADERS,
  HTTP_METHOD,
  HTTP_STATUS,
} from '@/lib/http/constants'
import {
  NOTIFICATION_ACTION,
  NOTIFICATION_CONFIG,
  NOTIFICATION_CODE,
} from './constants'

const { RETRY_AFTER } = HTTP_HEADERS
const { SETTINGS, RECEIVE, ACK } = NOTIFICATION_ACTION
const { ERROR, OK: RESPONSE_OK } = API_RESPONSE_STATUS
const { MAX_REQUEST_BYTES } = HTTP_BODY_LIMIT
const { POST } = HTTP_METHOD
const { SERVER_UNAVAILABLE } = API_ERROR_CODE
const { TIMEOUT_MS } = NOTIFICATION_CONFIG
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
  jsonNoStore({ body, status })
const failure = ({
  code,
  status = CONFLICT,
}: {
  code: string
  status?: number
}) => json({ body: { status: ERROR, code }, status })
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
  if (!isSameOrigin(request))
    return failure({ code: INVALID_REQUEST, status: FORBIDDEN })
  const available = configured && hasSessionPassword(password)
  if (!available)
    return failure({ code: SERVER_UNAVAILABLE, status: SERVICE_UNAVAILABLE })
  if (!context) {
    await clearSession()
    return failure({ code: SESSION_REQUIRED, status: UNAUTHORIZED })
  }
  const scope = readConnectionScope(request)
  if (scope === null)
    return failure({ code: INVALID_REQUEST, status: BAD_REQUEST })
  if (scope !== context.connectionScope)
    return failure({ code: CONNECTION_CHANGED })
  const bodyResult = await readBoundedJsonBody({
    request,
    maxBytes: MAX_REQUEST_BYTES,
    contentLengthPolicy: 'reject_invalid_or_excess',
  })
  if (bodyResult.kind !== 'ok' || !isRecord(bodyResult.value))
    return failure({ code: INVALID_REQUEST, status: BAD_REQUEST })
  const body = bodyResult.value
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
