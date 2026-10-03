import type { RECIPIENT_SEARCH_MODE } from '@/features/recipients/model'
import { RECIPIENT_RESULT_KIND } from '@/features/recipients/model'
import { isRecord } from '@/lib/api/is-record'
import { API_ERROR_CODE, API_RESPONSE_STATUS } from '@/lib/api/constants'
import {
  CACHE_CONTROL,
  HTTP_CONTENT_TYPE,
  HTTP_HEADERS,
  HTTP_METHOD,
  HTTP_STATUS,
} from '@/lib/http/constants'
import { ROUTES } from '@/lib/routes/constants'
import { RECIPIENT_ERROR_COPY } from './constants'

const { FOUND, NOT_FOUND } = RECIPIENT_RESULT_KIND
const { INVALID_REQUEST, INVALID_UPSTREAM_RESPONSE, SERVICE_UNAVAILABLE } =
  API_ERROR_CODE
const { OK: RESPONSE_OK, ERROR: RESPONSE_ERROR } = API_RESPONSE_STATUS
const { OK: HTTP_OK, UNAUTHORIZED: HTTP_UNAUTHORIZED } = HTTP_STATUS
const { POST } = HTTP_METHOD
const { CONTENT_TYPE } = HTTP_HEADERS
const { JSON: JSON_CONTENT_TYPE } = HTTP_CONTENT_TYPE
const { NO_STORE } = CACHE_CONTROL
const { RECIPIENT_SEARCH_API } = ROUTES

export type SearchMode =
  typeof RECIPIENT_SEARCH_MODE.PHONE | typeof RECIPIENT_SEARCH_MODE.USERNAME
export type SearchErrorCode =
  keyof typeof RECIPIENT_ERROR_COPY | typeof INVALID_REQUEST
export type RecipientSearchOutcome =
  | { kind: typeof FOUND; chatId: string }
  | { kind: typeof NOT_FOUND }
  | { kind: 'access-lost' }
  | { kind: 'error'; code: SearchErrorCode }

const readSearchResult = (value: unknown): RecipientSearchOutcome | null => {
  if (!isRecord(value)) return null
  const { status, result, chatId } = value
  if (status !== RESPONSE_OK) return null
  const isFound =
    result === FOUND && typeof chatId === 'string' && chatId.trim().length > 0
  if (isFound) return { kind: FOUND, chatId }
  if (result === NOT_FOUND) return { kind: NOT_FOUND }
  return null
}

const isSearchErrorCode = (value: unknown): value is SearchErrorCode =>
  typeof value === 'string' &&
  (value === INVALID_REQUEST || Object.hasOwn(RECIPIENT_ERROR_COPY, value))

const readErrorCode = (value: unknown): SearchErrorCode | null => {
  if (!isRecord(value)) return null
  const { status, code } = value
  const knownError = status === RESPONSE_ERROR && isSearchErrorCode(code)
  return knownError ? code : null
}

export const requestRecipientSearch = async ({
  mode,
  value,
  signal,
  fetcher = fetch,
}: {
  mode: SearchMode
  value: string
  signal: AbortSignal
  fetcher?: typeof fetch
}): Promise<RecipientSearchOutcome> => {
  let response: Response
  try {
    response = await fetcher(RECIPIENT_SEARCH_API, {
      method: POST,
      headers: { [CONTENT_TYPE]: JSON_CONTENT_TYPE },
      body: JSON.stringify({ mode, value }),
      cache: NO_STORE,
      signal,
    })
  } catch {
    return { kind: 'error', code: SERVICE_UNAVAILABLE }
  }
  if (response.status === HTTP_UNAUTHORIZED) return { kind: 'access-lost' }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    return { kind: 'error', code: INVALID_UPSTREAM_RESPONSE }
  }
  const searchResult = readSearchResult(payload)
  if (response.status === HTTP_OK && searchResult) return searchResult
  return {
    kind: 'error',
    code: readErrorCode(payload) ?? INVALID_UPSTREAM_RESPONSE,
  }
}
