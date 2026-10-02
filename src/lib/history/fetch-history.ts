import { CancelledError } from '@tanstack/react-query'
import { HistoryQueryError } from './types'
import { isRecord } from '@/lib/api/is-record'
import type { ChatsErrorCode } from '@/lib/chats/types'
import type { MessageDTO } from '@/lib/messages/types'
import { isMessageDTO } from '@/lib/messages/validate-message'
import { API_ERROR_CODE, API_RESPONSE_STATUS } from '@/lib/api/constants'
import { CHAT_QUERY_CONFIG } from '@/lib/chats/constants'
import {
  CACHE_CONTROL,
  FETCH_CREDENTIALS,
  HTTP_HEADERS,
  HTTP_METHOD,
  HTTP_CONTENT_TYPE,
  HTTP_STATUS,
} from '@/lib/http/constants'
import { MESSAGE_STATUS } from '@/lib/messages/constants'
import { ROUTES } from '@/lib/routes/constants'

const {
  SERVICE_UNAVAILABLE,
  INVALID_UPSTREAM_RESPONSE,
  CONNECTION_CHANGED,
  SESSION_REQUIRED,
  INVALID_REQUEST,
  SERVER_UNAVAILABLE,
  RATE_LIMITED,
  RETRY_LATER,
} = API_ERROR_CODE
const { OK: RESPONSE_OK, ERROR: RESPONSE_ERROR } = API_RESPONSE_STATUS
const {
  OK,
  BAD_REQUEST,
  FORBIDDEN,
  UNAUTHORIZED,
  CONFLICT,
  TOO_MANY_REQUESTS,
  BAD_GATEWAY,
  SERVICE_UNAVAILABLE: HTTP_UNAVAILABLE,
} = HTTP_STATUS
const { CHAT_HISTORY_API } = ROUTES
const { POST } = HTTP_METHOD
const { NO_STORE } = CACHE_CONTROL
const { SAME_ORIGIN } = FETCH_CREDENTIALS
const { CONNECTION_SCOPE, CONTENT_TYPE } = HTTP_HEADERS
const { JSON: JSON_CONTENT_TYPE } = HTTP_CONTENT_TYPE
const { SCOPE_PATTERN } = CHAT_QUERY_CONFIG
const { DELIVERED, READ } = MESSAGE_STATUS
const errorStatuses: Partial<Record<ChatsErrorCode, readonly number[]>> = {
  [SESSION_REQUIRED]: [UNAUTHORIZED],
  [INVALID_REQUEST]: [BAD_REQUEST, FORBIDDEN],
  [CONNECTION_CHANGED]: [CONFLICT],
  [SERVER_UNAVAILABLE]: [HTTP_UNAVAILABLE],
  [SERVICE_UNAVAILABLE]: [HTTP_UNAVAILABLE],
  [RETRY_LATER]: [HTTP_UNAVAILABLE],
  [RATE_LIMITED]: [TOO_MANY_REQUESTS],
  [INVALID_UPSTREAM_RESPONSE]: [BAD_GATEWAY],
}
const isErrorCode = (code: unknown): code is ChatsErrorCode =>
  typeof code === 'string' && Object.hasOwn(errorStatuses, code)
const isHistoryMessage = ({
  value,
  chatId,
}: {
  value: MessageDTO
  chatId: string
}): boolean => {
  const validStatus =
    value.status === null || value.status === DELIVERED || value.status === READ
  const valid =
    value.chatId === chatId &&
    value.timestamp !== null &&
    value.acceptedAt === null &&
    validStatus
  return valid
}
export const fetchHistory = async ({
  connectionScope,
  chatId,
  signal,
  isActive,
  fetcher = fetch,
}: {
  connectionScope: string
  chatId: string
  signal: AbortSignal
  isActive: () => boolean
  fetcher?: typeof fetch
}): Promise<MessageDTO[]> => {
  const assertActive = () => {
    const closed = signal.aborted || !isActive()
    if (closed) throw new CancelledError({ silent: true })
  }
  assertActive()
  let response: Response
  try {
    response = await fetcher(CHAT_HISTORY_API, {
      method: POST,
      cache: NO_STORE,
      credentials: SAME_ORIGIN,
      headers: {
        [CONNECTION_SCOPE]: connectionScope,
        [CONTENT_TYPE]: JSON_CONTENT_TYPE,
      },
      body: JSON.stringify({ chatId }),
      signal,
    })
  } catch {
    assertActive()
    throw new HistoryQueryError({ code: SERVICE_UNAVAILABLE, status: null })
  }
  assertActive()
  const invalidResponse = () =>
    new HistoryQueryError({
      code: INVALID_UPSTREAM_RESPONSE,
      status: response.status,
    })
  let value: unknown
  try {
    value = await response.json()
  } catch {
    assertActive()
    throw invalidResponse()
  }
  assertActive()
  if (!isRecord(value)) throw invalidResponse()
  const {
    status,
    code,
    connectionScope: returnedScope,
    chatId: returnedChat,
    messages,
  } = value
  if (status === RESPONSE_ERROR) {
    if (!isErrorCode(code)) throw invalidResponse()
    if (!errorStatuses[code]?.includes(response.status)) throw invalidResponse()
    throw new HistoryQueryError({ code, status: response.status })
  }
  if (!Array.isArray(messages)) throw invalidResponse()
  const success =
    response.status === OK &&
    status === RESPONSE_OK &&
    typeof returnedScope === 'string' &&
    SCOPE_PATTERN.test(returnedScope) &&
    returnedChat === chatId &&
    Array.isArray(messages)
  if (!success) throw invalidResponse()
  if (returnedScope !== connectionScope)
    throw new HistoryQueryError({ code: CONNECTION_CHANGED, status: CONFLICT })
  return messages.map((item) => {
    if (!isMessageDTO(item)) throw invalidResponse()
    if (!isHistoryMessage({ value: item, chatId })) throw invalidResponse()
    return {
      chatId: item.chatId,
      idMessage: item.idMessage,
      direction: item.direction,
      kind: item.kind,
      text: item.text,
      timestamp: item.timestamp,
      acceptedAt: null,
      status: item.status,
    }
  })
}
