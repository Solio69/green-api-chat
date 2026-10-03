import { resolveLogin } from '@/features/auth/application'
import type {
  InstanceCredentials,
  StateResult,
} from '@/lib/green-api/get-state'
import { API_ERROR_CODE, API_RESPONSE_STATUS } from '@/lib/api/constants'
import {
  CACHE_CONTROL,
  HTTP_CONTENT_TYPE,
  HTTP_HEADERS,
  HTTP_STATUS,
  HTTP_SYNTAX,
} from '@/lib/http/constants'

const { INVALID_REQUEST } = API_ERROR_CODE
const { ERROR: RESPONSE_ERROR } = API_RESPONSE_STATUS
const { CACHE_CONTROL: CACHE_CONTROL_HEADER, CONTENT_TYPE } = HTTP_HEADERS
const { NO_STORE } = CACHE_CONTROL
const { JSON: JSON_CONTENT_TYPE } = HTTP_CONTENT_TYPE
const { BAD_REQUEST: HTTP_BAD_REQUEST } = HTTP_STATUS
const { CONTENT_TYPE_PARAMETER_SEPARATOR } = HTTP_SYNTAX

const invalidRequest = (): Response =>
  Response.json(
    { status: RESPONSE_ERROR, code: INVALID_REQUEST },
    {
      status: HTTP_BAD_REQUEST,
      headers: { [CACHE_CONTROL_HEADER]: NO_STORE },
    },
  )

export const handleLoginRequest = async ({
  request,
  getState,
  saveSession,
}: {
  request: Request
  getState: (credentials: InstanceCredentials) => Promise<StateResult>
  saveSession: (credentials: InstanceCredentials) => Promise<void>
}): Promise<Response> => {
  const mediaType = request.headers
    .get(CONTENT_TYPE)
    ?.split(CONTENT_TYPE_PARAMETER_SEPARATOR)[0]
    .trim()
    .toLowerCase()
  if (mediaType !== JSON_CONTENT_TYPE) return invalidRequest()
  let rawBody: string
  try {
    rawBody = await request.text()
  } catch {
    return invalidRequest()
  }

  const result = await resolveLogin({ rawBody, getState, saveSession })
  return Response.json(result.body, {
    status: result.status,
    headers: { [CACHE_CONTROL_HEADER]: NO_STORE },
  })
}
