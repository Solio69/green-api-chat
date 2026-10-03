import { CancelledError } from '@tanstack/react-query'
import { ChatsQueryError } from './types'
import { CHAT_SCOPE_CONFIG } from '@/features/chats/model'
import type { PersonalChat, ChatsErrorCode } from '@/features/chats/model'
import { isRecord } from '@/lib/api/is-record'
import { API_ERROR_CODE, API_RESPONSE_STATUS } from '@/lib/api/constants'
import {
  CACHE_CONTROL,
  FETCH_CREDENTIALS,
  HTTP_HEADERS,
  HTTP_METHOD,
  HTTP_STATUS,
} from '@/lib/http/constants'
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
  UNAUTHORIZED,
  CONFLICT,
  TOO_MANY_REQUESTS,
  BAD_GATEWAY,
  SERVICE_UNAVAILABLE: HTTP_UNAVAILABLE,
} = HTTP_STATUS
const { CHATS_API } = ROUTES
const { GET } = HTTP_METHOD
const { NO_STORE } = CACHE_CONTROL
const { SAME_ORIGIN } = FETCH_CREDENTIALS
const { CONNECTION_SCOPE } = HTTP_HEADERS
const { PATTERN: SCOPE_PATTERN } = CHAT_SCOPE_CONFIG
const errorStatuses: Partial<Record<ChatsErrorCode, number>> = {
  [SESSION_REQUIRED]: UNAUTHORIZED,
  [INVALID_REQUEST]: BAD_REQUEST,
  [CONNECTION_CHANGED]: CONFLICT,
  [SERVER_UNAVAILABLE]: HTTP_UNAVAILABLE,
  [SERVICE_UNAVAILABLE]: HTTP_UNAVAILABLE,
  [RETRY_LATER]: HTTP_UNAVAILABLE,
  [RATE_LIMITED]: TOO_MANY_REQUESTS,
  [INVALID_UPSTREAM_RESPONSE]: BAD_GATEWAY,
}
const isErrorCode = (code: unknown): code is ChatsErrorCode =>
  typeof code === 'string' &&
  Object.keys(errorStatuses).some((known) => known === code)
const isOptionalText = (value: unknown): value is string | null =>
  value === null || (typeof value === 'string' && value.trim().length > 0)
const isPersonalChat = (value: unknown): value is PersonalChat => {
  if (!isRecord(value)) return false
  const isChat =
    typeof value.chatId === 'string' &&
    value.chatId.trim().length > 0 &&
    isOptionalText(value.name) &&
    isOptionalText(value.username) &&
    isOptionalText(value.phone)
  return isChat
}
export type FetchChatsOptions = {
  connectionScope: string
  signal: AbortSignal
  isActive: () => boolean
  fetcher?: typeof fetch
}
export const fetchChats = async ({
  connectionScope,
  signal,
  isActive,
  fetcher = fetch,
}: FetchChatsOptions): Promise<PersonalChat[]> => {
  const assertActive = () => {
    const isClosed = signal.aborted || !isActive()
    if (isClosed) throw new CancelledError({ silent: true })
  }
  assertActive()
  let response: Response
  try {
    response = await fetcher(CHATS_API, {
      method: GET,
      cache: NO_STORE,
      credentials: SAME_ORIGIN,
      headers: { [CONNECTION_SCOPE]: connectionScope },
      signal,
    })
  } catch {
    assertActive()
    throw new ChatsQueryError({ code: SERVICE_UNAVAILABLE, status: null })
  }
  const invalidResponse = () =>
    new ChatsQueryError({
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
  const { status, code, connectionScope: returnedScope, chats } = value
  const isExpectedError =
    status === RESPONSE_ERROR &&
    isErrorCode(code) &&
    errorStatuses[code] === response.status
  if (isExpectedError)
    throw new ChatsQueryError({ code, status: response.status })
  const isSuccess =
    response.status === OK &&
    status === RESPONSE_OK &&
    typeof returnedScope === 'string' &&
    SCOPE_PATTERN.test(returnedScope) &&
    Array.isArray(chats)
  if (!isSuccess) throw invalidResponse()
  if (returnedScope !== connectionScope)
    throw new ChatsQueryError({ code: CONNECTION_CHANGED, status: CONFLICT })
  return chats.map((item: unknown) => {
    if (!isPersonalChat(item)) throw invalidResponse()
    return {
      chatId: item.chatId,
      name: item.name,
      username: item.username,
      phone: item.phone,
    }
  })
}
