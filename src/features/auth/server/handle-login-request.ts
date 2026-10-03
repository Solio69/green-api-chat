import { resolveLogin } from '@/features/auth/application'
import type {
  InstanceCredentials,
  StateResult,
} from '@/lib/green-api/get-state'
import { isJsonMediaType, jsonNoStore } from '@/server/http'
import { API_ERROR_CODE, API_RESPONSE_STATUS } from '@/lib/api/constants'
import { HTTP_STATUS } from '@/lib/http/constants'

const { INVALID_REQUEST } = API_ERROR_CODE
const { ERROR: RESPONSE_ERROR } = API_RESPONSE_STATUS
const { BAD_REQUEST: HTTP_BAD_REQUEST } = HTTP_STATUS

const invalidRequest = (): Response =>
  jsonNoStore({
    body: { status: RESPONSE_ERROR, code: INVALID_REQUEST },
    status: HTTP_BAD_REQUEST,
  })

export const handleLoginRequest = async ({
  request,
  getState,
  saveSession,
}: {
  request: Request
  getState: (credentials: InstanceCredentials) => Promise<StateResult>
  saveSession: (credentials: InstanceCredentials) => Promise<void>
}): Promise<Response> => {
  if (!isJsonMediaType(request)) return invalidRequest()
  let rawBody: string
  try {
    rawBody = await request.text()
  } catch {
    return invalidRequest()
  }

  const result = await resolveLogin({ rawBody, getState, saveSession })
  return jsonNoStore({ body: result.body, status: result.status })
}
