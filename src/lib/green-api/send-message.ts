import { classifyBadRequest } from './get-state'
import { isSafeIdentifier } from './safe-identifier'
import { fetchGreenApi } from './transport'
import { isRecord } from '@/lib/api/is-record'
import type {
  ProviderSendResult,
  SendMessageOptions,
} from '@/lib/sending/types'
import { API_ERROR_CODE, API_RESPONSE_STATUS } from '@/lib/api/constants'
import { HTTP_METHOD, HTTP_STATUS } from '@/lib/http/constants'
import { SEND_CONFIG } from '@/lib/sending/constants'
import { GREEN_API_CONFIG } from './constants'

const {
  INVALID_TOKEN,
  INVALID_INSTANCE,
  INSTANCE_EXPIRED,
  UPSTREAM_REJECTED,
  RATE_LIMITED,
  OUTCOME_UNKNOWN,
} = API_ERROR_CODE
const { OK: RESPONSE_OK } = API_RESPONSE_STATUS
const { OK, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, TOO_MANY_REQUESTS } =
  HTTP_STATUS
const { POST } = HTTP_METHOD
const { PROVIDER_VALIDATION_PATTERN } = SEND_CONFIG
const { SEND_MESSAGE_METHOD, TIMEOUT_MS } = GREEN_API_CONFIG

export const sendMessage = async ({
  credentials,
  chatId,
  message,
  fetcher = fetch,
  signal: callerSignal,
}: SendMessageOptions): Promise<ProviderSendResult> => {
  try {
    callerSignal?.throwIfAborted()
    // Once dispatched, only the server deadline ends the local attempt.
    const signal = AbortSignal.timeout(TIMEOUT_MS)
    const response = await fetchGreenApi({
      credentials,
      methodName: SEND_MESSAGE_METHOD,
      method: POST,
      jsonBody: { chatId, message },
      signal,
      fetcher,
    })
    signal.throwIfAborted()
    if (response.status === UNAUTHORIZED) return { kind: INVALID_TOKEN }
    if (response.status === FORBIDDEN) return { kind: INVALID_INSTANCE }
    if (response.status === TOO_MANY_REQUESTS) return { kind: RATE_LIMITED }
    const needsBody = response.status === OK || response.status === BAD_REQUEST
    if (!needsBody) return { kind: OUTCOME_UNKNOWN }
    const body = await response.text()
    signal.throwIfAborted()
    if (response.status === BAD_REQUEST) {
      if (PROVIDER_VALIDATION_PATTERN.test(body))
        return { kind: UPSTREAM_REJECTED }
      const refusal = classifyBadRequest(body)
      if (refusal.kind === INSTANCE_EXPIRED) return { kind: INSTANCE_EXPIRED }
      return { kind: OUTCOME_UNKNOWN }
    }
    const value: unknown = JSON.parse(body)
    if (!isRecord(value)) return { kind: OUTCOME_UNKNOWN }
    const { idMessage } = value
    const validId =
      typeof idMessage === 'string' &&
      isSafeIdentifier({
        value: idMessage,
        secrets: Object.values(credentials),
      })
    if (!validId) return { kind: OUTCOME_UNKNOWN }
    return { kind: RESPONSE_OK, idMessage }
  } catch {
    return { kind: OUTCOME_UNKNOWN }
  }
}
