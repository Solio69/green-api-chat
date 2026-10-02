import { resolveSearchResult, searchErrorResponse } from './resolve-search'
import { parseSearchRequest } from './validate-search'
import type { RecipientQuery } from './validate-search'
import type { CheckAccountResult } from '@/lib/green-api/check-account'
import type { InstanceCredentials } from '@/lib/green-api/get-state'
import { API_ERROR_CODE } from '@/lib/api/constants'
import {
  HTTP_CONTENT_TYPE,
  HTTP_HEADERS,
  HTTP_STATUS,
  HTTP_SYNTAX,
} from '@/lib/http/constants'

const {
  INVALID_REQUEST,
  SESSION_REQUIRED,
  SERVICE_UNAVAILABLE,
  SERVER_UNAVAILABLE,
} = API_ERROR_CODE
const { CONTENT_TYPE } = HTTP_HEADERS
const { JSON: JSON_CONTENT_TYPE } = HTTP_CONTENT_TYPE
const { CONTENT_TYPE_PARAMETER_SEPARATOR } = HTTP_SYNTAX
const {
  BAD_REQUEST: HTTP_BAD_REQUEST,
  UNAUTHORIZED: HTTP_UNAUTHORIZED,
  SERVICE_UNAVAILABLE: HTTP_SERVICE_UNAVAILABLE,
} = HTTP_STATUS

export type SearchContext = {
  configured: boolean
  credentials: InstanceCredentials | null
}

export const handleSearchRequest = async ({
  request,
  context,
  lookup,
  clearSession,
}: {
  request: Request
  context: SearchContext
  lookup: (options: {
    credentials: InstanceCredentials
    query: RecipientQuery
  }) => Promise<CheckAccountResult>
  clearSession: () => Promise<void>
}): Promise<Response> => {
  if (!context.configured)
    return searchErrorResponse({
      code: SERVER_UNAVAILABLE,
      status: HTTP_SERVICE_UNAVAILABLE,
    })
  if (!context.credentials)
    return searchErrorResponse({
      code: SESSION_REQUIRED,
      status: HTTP_UNAUTHORIZED,
    })

  const mediaType = request.headers
    .get(CONTENT_TYPE)
    ?.split(CONTENT_TYPE_PARAMETER_SEPARATOR)[0]
    .trim()
    .toLowerCase()
  if (mediaType !== JSON_CONTENT_TYPE)
    return searchErrorResponse({
      code: INVALID_REQUEST,
      status: HTTP_BAD_REQUEST,
    })

  let parsed: unknown
  try {
    parsed = await request.json()
  } catch {
    return searchErrorResponse({
      code: INVALID_REQUEST,
      status: HTTP_BAD_REQUEST,
    })
  }
  const query = parseSearchRequest(parsed)
  if (!query)
    return searchErrorResponse({
      code: INVALID_REQUEST,
      status: HTTP_BAD_REQUEST,
    })

  try {
    const result = await lookup({ credentials: context.credentials, query })
    return await resolveSearchResult({ result, clearSession })
  } catch {
    return searchErrorResponse({
      code: SERVICE_UNAVAILABLE,
      status: HTTP_SERVICE_UNAVAILABLE,
    })
  }
}
