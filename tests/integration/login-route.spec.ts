import { expect, test } from '@playwright/test'
import { handleLoginRequest } from '@/features/auth/server'
import type {
  InstanceCredentials,
  StateResult,
} from '@/lib/green-api/get-state'
import {
  HTTP_CONTENT_TYPE,
  HTTP_HEADERS,
  HTTP_METHOD,
} from '@/lib/http/constants'
import {
  CREDENTIALS,
  GREEN_API_CONTRACT,
  LOGIN_API_CONTRACT,
  ROUTES,
  TEST_REQUEST_FIXTURES,
} from '../constants'

const { ID, TOKEN } = CREDENTIALS
const { LOGIN_API } = ROUTES
const { JSON: JSON_CONTENT_TYPE } = HTTP_CONTENT_TYPE
const { CONTENT_TYPE } = HTTP_HEADERS
const { POST: HTTP_POST } = HTTP_METHOD
const URL = `http://localhost${LOGIN_API}`
const { AUTHORIZED } = GREEN_API_CONTRACT
const {
  OK_STATUS,
  INVALID_REQUEST_STATUS,
  UNAUTHORIZED_STATUS,
  RESPONSE_OK,
  RESPONSE_ERROR,
  INVALID_REQUEST,
  INVALID_TOKEN,
  CACHE_CONTROL_HEADER,
  CONTENT_TYPE_HEADER,
  CACHE_CONTROL_VALUE,
  JSON_CONTENT_TYPE: EXPECTED_JSON_CONTENT_TYPE,
} = LOGIN_API_CONTRACT
const {
  SHORT_BROKEN_JSON,
  PLAIN_CONTENT_TYPE,
  OVERSIZE_FILL,
  OVERSIZE_BODY_LENGTH,
} = TEST_REQUEST_FIXTURES
const validBody = JSON.stringify({ idInstance: ID, apiTokenInstance: TOKEN })
const TEST_ERROR_MESSAGE = {
  SESSION_MUST_NOT_BE_SAVED: 'Session must not be saved',
} as const
const { SESSION_MUST_NOT_BE_SAVED } = TEST_ERROR_MESSAGE

const request = ({
  body,
  contentType = JSON_CONTENT_TYPE,
}: {
  body: string
  contentType?: string
}) =>
  new Request(URL, {
    method: HTTP_POST,
    headers: { [CONTENT_TYPE]: contentType },
    body,
  })

test('login-route: authorized responds with no-store and no credentials', async () => {
  const calls: InstanceCredentials[] = []
  const saves: InstanceCredentials[] = []
  const response = await handleLoginRequest({
    request: request({ body: validBody }),
    getState: async (credentials) => {
      calls.push(credentials)
      return { kind: AUTHORIZED, body: { stateInstance: AUTHORIZED } }
    },
    saveSession: async (credentials) => void saves.push(credentials),
  })
  expect(response.status).toBe(OK_STATUS)
  expect(response.headers.get(CACHE_CONTROL_HEADER)).toBe(CACHE_CONTROL_VALUE)
  expect(response.headers.get(CONTENT_TYPE_HEADER)).toContain(
    EXPECTED_JSON_CONTENT_TYPE,
  )
  expect(await response.json()).toEqual({ status: RESPONSE_OK })
  expect(calls).toEqual([{ idInstance: ID, apiTokenInstance: TOKEN }])
  expect(saves).toEqual(calls)
})

for (const [index, [body, contentType]] of (
  [
    [SHORT_BROKEN_JSON, JSON_CONTENT_TYPE],
    [validBody, PLAIN_CONTENT_TYPE],
    [OVERSIZE_FILL.repeat(OVERSIZE_BODY_LENGTH), JSON_CONTENT_TYPE],
  ] as const
).entries()) {
  test(`login-route: malformed request case ${index} is rejected before provider`, async () => {
    let calls = 0
    const response = await handleLoginRequest({
      request: request({ body, contentType }),
      getState: async (): Promise<StateResult> => {
        calls += 1
        return { kind: AUTHORIZED, body: { stateInstance: AUTHORIZED } }
      },
      saveSession: async () => {
        throw new Error(SESSION_MUST_NOT_BE_SAVED)
      },
    })
    expect(response.status).toBe(INVALID_REQUEST_STATUS)
    expect(response.headers.get(CACHE_CONTROL_HEADER)).toBe(CACHE_CONTROL_VALUE)
    expect(await response.json()).toEqual({
      status: RESPONSE_ERROR,
      code: INVALID_REQUEST,
    })
    expect(calls).toBe(0)
  })
}

test('login-route: provider rejection uses normalized status and body', async () => {
  const response = await handleLoginRequest({
    request: request({ body: validBody }),
    getState: async () => ({ kind: INVALID_TOKEN }),
    saveSession: async () => {
      throw new Error(SESSION_MUST_NOT_BE_SAVED)
    },
  })
  expect(response.status).toBe(UNAUTHORIZED_STATUS)
  expect(response.headers.get(CACHE_CONTROL_HEADER)).toBe(CACHE_CONTROL_VALUE)
  const body = await response.text()
  expect(body).toContain(INVALID_TOKEN)
  expect(body).not.toContain(TOKEN)
})
