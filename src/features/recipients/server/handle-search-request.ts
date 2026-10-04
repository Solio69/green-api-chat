import { resolveSearchResult, searchErrorResponse } from './resolve-search'
import { parseSearchRequest } from '@/features/recipients/model'
import type { RecipientQuery } from '@/features/recipients/model'
import type { CheckAccountResult } from '@/server/green-api/check-account'
import { isJsonMediaType, readUnboundedJsonBody } from '@/server/http'
import type { InstanceCredentials } from '@/shared/kernel/api/instance-credentials'
import { API_ERROR_CODE } from '@/shared/kernel/api/constants'
import { HTTP_STATUS } from '@/shared/kernel/http/constants'

const {
  INVALID_REQUEST,
  SESSION_REQUIRED,
  SERVICE_UNAVAILABLE,
  SERVER_UNAVAILABLE,
} = API_ERROR_CODE
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

  if (!isJsonMediaType(request))
    return searchErrorResponse({
      code: INVALID_REQUEST,
      status: HTTP_BAD_REQUEST,
    })

  const parsed = await readUnboundedJsonBody(request)
  if (parsed.kind !== 'ok')
    return searchErrorResponse({
      code: INVALID_REQUEST,
      status: HTTP_BAD_REQUEST,
    })
  const query = parseSearchRequest(parsed.value)
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
