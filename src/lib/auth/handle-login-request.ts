import { API_ERROR_CODE, API_RESPONSE_STATUS } from '@/lib/api/constants'
import type {
  InstanceCredentials,
  StateResult,
} from '@/lib/green-api/get-state'
import {
  CACHE_CONTROL,
  HTTP_CONTENT_TYPE,
  HTTP_HEADERS,
  HTTP_STATUS,
  HTTP_SYNTAX,
  TEXT_ENCODING,
} from '@/lib/http/constants'
import { AUTH_CONFIG } from './constants'
import { resolveLogin } from './resolve-login'

const { INVALID_REQUEST } = API_ERROR_CODE
const { ERROR: RESPONSE_ERROR } = API_RESPONSE_STATUS
const { CACHE_CONTROL: CACHE_CONTROL_HEADER, CONTENT_TYPE } = HTTP_HEADERS
const { NO_STORE } = CACHE_CONTROL
const { JSON: JSON_CONTENT_TYPE } = HTTP_CONTENT_TYPE
const { BAD_REQUEST: HTTP_BAD_REQUEST } = HTTP_STATUS
const { CONTENT_TYPE_PARAMETER_SEPARATOR } = HTTP_SYNTAX
const { UTF_8 } = TEXT_ENCODING
const { MAX_REQUEST_BYTES } = AUTH_CONFIG

function invalidRequest(): Response {
  return Response.json(
    { status: RESPONSE_ERROR, code: INVALID_REQUEST },
    {
      status: HTTP_BAD_REQUEST,
      headers: { [CACHE_CONTROL_HEADER]: NO_STORE },
    },
  )
}

async function readLimitedBody(request: Request): Promise<string | null> {
  if (!request.body) return null
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let length = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > MAX_REQUEST_BYTES) {
        await reader.cancel()
        return null
      }
      chunks.push(value)
    }
    const body = new Uint8Array(length)
    let offset = 0
    for (const chunk of chunks) {
      body.set(chunk, offset)
      offset += chunk.byteLength
    }
    return new TextDecoder(UTF_8, { fatal: true }).decode(body)
  } catch {
    return null
  } finally {
    reader.releaseLock()
  }
}

export async function handleLoginRequest(
  request: Request,
  getState: (credentials: InstanceCredentials) => Promise<StateResult>,
  saveSession: (credentials: InstanceCredentials) => Promise<void>,
): Promise<Response> {
  const mediaType = request.headers
    .get(CONTENT_TYPE)
    ?.split(CONTENT_TYPE_PARAMETER_SEPARATOR)[0]
    .trim()
    .toLowerCase()
  if (mediaType !== JSON_CONTENT_TYPE) return invalidRequest()
  const rawBody = await readLimitedBody(request)
  if (rawBody === null) return invalidRequest()

  const result = await resolveLogin(rawBody, getState, saveSession)
  return Response.json(result.body, {
    status: result.status,
    headers: { [CACHE_CONTROL_HEADER]: NO_STORE },
  })
}
