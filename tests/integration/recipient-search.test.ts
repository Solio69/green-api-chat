import { expect, test } from 'vitest'
import { parseSearchRequest } from '@/features/recipients/model'
import { handleSearchRequest } from '@/features/recipients/server'
import type { InstanceCredentials } from '@/shared/kernel/api/instance-credentials'
import { HTTP_HEADERS, HTTP_METHOD } from '@/shared/kernel/http/constants'
import { EMPTY_STRING } from '@/shared/kernel/ui/constants'
import {
  CREDENTIALS,
  LOGIN_API_CONTRACT,
  RECIPIENT_API_CONTRACT,
  RECIPIENT_SCENARIOS,
  ROUTES,
  TEST_REQUEST_FIXTURES,
  TEST_PROVIDER_FIXTURES,
} from '../constants'

const { ID: idInstance, TOKEN: apiTokenInstance } = CREDENTIALS
const credentials: InstanceCredentials = { idInstance, apiTokenInstance }
const { RECIPIENT_SEARCH_API } = ROUTES
const URL = `http://localhost${RECIPIENT_SEARCH_API}`
const {
  MODE_PHONE,
  MODE_USERNAME,
  RESULT_FOUND,
  RESULT_NOT_FOUND,
  SESSION_REQUIRED,
  TOO_LONG_USERNAME,
  MAX_LENGTH_USERNAME,
  SHORT_USERNAME,
} = RECIPIENT_API_CONTRACT
const { foundPhone, foundUsername, chatId } = RECIPIENT_SCENARIOS
const {
  OK_STATUS,
  INVALID_REQUEST_STATUS,
  UNAUTHORIZED_STATUS,
  UNAVAILABLE_STATUS,
  RESPONSE_OK,
  RESPONSE_ERROR,
  INVALID_REQUEST,
  INVALID_TOKEN,
  RATE_LIMITED,
  RATE_LIMIT_STATUS,
  SERVICE_UNAVAILABLE,
  SERVER_UNAVAILABLE,
  JSON_CONTENT_TYPE,
  CACHE_CONTROL_HEADER,
  CACHE_CONTROL_VALUE,
} = LOGIN_API_CONTRACT
const { POST: HTTP_POST } = HTTP_METHOD
const { CONTENT_TYPE } = HTTP_HEADERS
const { DETAIL: PROVIDER_DETAIL } = TEST_PROVIDER_FIXTURES
const {
  BROKEN_JSON,
  PLAIN_CONTENT_TYPE,
  OVERSIZE_FILL,
  OVERSIZE_BODY_LENGTH,
  TOO_LONG_PHONE,
} = TEST_REQUEST_FIXTURES

const validPhone = { mode: MODE_PHONE, value: foundPhone }
const validUsername = { mode: MODE_USERNAME, value: foundUsername }
const INVALID_SEARCH_VALUES = {
  PHONE_LEADING_ZERO: '012345',
  PHONE_WITH_SPACE: '123 abc',
  USERNAME_PREFIX_ONLY: '@',
  USERNAME_WITH_DASH: 'bad-name',
} as const
const {
  PHONE_LEADING_ZERO,
  PHONE_WITH_SPACE,
  USERNAME_PREFIX_ONLY,
  USERNAME_WITH_DASH,
} = INVALID_SEARCH_VALUES

const request = ({
  body,
  contentType = JSON_CONTENT_TYPE,
}: {
  body: string
  contentType?: string
}): Request =>
  new Request(URL, {
    method: HTTP_POST,
    headers: { [CONTENT_TYPE]: contentType },
    body,
  })

test('recipient-search: parser accepts either username spelling and safe phone', () => {
  expect(parseSearchRequest(validPhone)).toEqual({
    phoneNumber: Number(foundPhone),
  })
  expect(parseSearchRequest(validUsername)).toEqual({
    username: `@${foundUsername}`,
  })
  expect(
    parseSearchRequest({ mode: MODE_USERNAME, value: `@${foundUsername}` }),
  ).toEqual({ username: `@${foundUsername}` })
  expect(
    parseSearchRequest({ mode: MODE_USERNAME, value: SHORT_USERNAME }),
  ).toEqual({ username: `@${SHORT_USERNAME}` })
  expect(
    parseSearchRequest({ mode: MODE_USERNAME, value: MAX_LENGTH_USERNAME }),
  ).toEqual({ username: `@${MAX_LENGTH_USERNAME}` })
})

test('recipient-search: parser rejects malformed input before provider', () => {
  for (const input of [
    null,
    [],
    { ...validPhone, extra: true },
    { mode: MODE_PHONE, value: EMPTY_STRING },
    { mode: MODE_PHONE, value: PHONE_LEADING_ZERO },
    { mode: MODE_PHONE, value: PHONE_WITH_SPACE },
    { mode: MODE_PHONE, value: TOO_LONG_PHONE },
    { mode: MODE_USERNAME, value: USERNAME_PREFIX_ONLY },
    { mode: MODE_USERNAME, value: USERNAME_WITH_DASH },
    { mode: MODE_USERNAME, value: TOO_LONG_USERNAME },
  ])
    expect(parseSearchRequest(input)).toBeNull()
})

test('recipient-search: configuration and session fail before body is read', async () => {
  let calls = 0
  const lookup = async () => {
    calls += 1
    return { kind: RESULT_NOT_FOUND } as const
  }
  const clearSession = async () => undefined
  const missingConfig = await handleSearchRequest({
    request: request({ body: BROKEN_JSON }),
    context: { configured: false, credentials: null },
    lookup,
    clearSession,
  })
  expect(missingConfig.status).toBe(UNAVAILABLE_STATUS)
  expect(await missingConfig.json()).toEqual({
    status: RESPONSE_ERROR,
    code: SERVER_UNAVAILABLE,
  })
  const missingSession = await handleSearchRequest({
    request: request({ body: BROKEN_JSON }),
    context: { configured: true, credentials: null },
    lookup,
    clearSession,
  })
  expect(missingSession.status).toBe(UNAUTHORIZED_STATUS)
  expect(await missingSession.json()).toEqual({
    status: RESPONSE_ERROR,
    code: SESSION_REQUIRED,
  })
  expect(calls).toBe(0)
})

test('recipient-search: invalid JSON, media type, size and value skip provider', async () => {
  let calls = 0
  const lookup = async () => {
    calls += 1
    return { kind: RESULT_NOT_FOUND } as const
  }
  const clearSession = async () => undefined
  for (const currentRequest of [
    request({ body: BROKEN_JSON }),
    request({
      body: JSON.stringify(validPhone),
      contentType: PLAIN_CONTENT_TYPE,
    }),
    request({ body: JSON.stringify({ ...validPhone, extra: true }) }),
    request({
      body: JSON.stringify({ mode: MODE_USERNAME, value: TOO_LONG_USERNAME }),
    }),
    request({ body: OVERSIZE_FILL.repeat(OVERSIZE_BODY_LENGTH) }),
  ]) {
    const response = await handleSearchRequest({
      request: currentRequest,
      context: { configured: true, credentials },
      lookup,
      clearSession,
    })
    expect(response.status).toBe(INVALID_REQUEST_STATUS)
    expect(await response.json()).toEqual({
      status: RESPONSE_ERROR,
      code: INVALID_REQUEST,
    })
  }
  expect(calls).toBe(0)
})

test('recipient-search: found and absent results expose only safe fields', async () => {
  const calls: unknown[] = []
  const found = await handleSearchRequest({
    request: request({ body: JSON.stringify(validPhone) }),
    context: { configured: true, credentials },
    lookup: async ({ credentials: actualCredentials, query }) => {
      calls.push({ actualCredentials, query })
      return { kind: RESULT_FOUND, chatId }
    },
    clearSession: async () => undefined,
  })
  expect(found.status).toBe(OK_STATUS)
  const foundBody = await found.json()
  expect(foundBody).toEqual({
    status: RESPONSE_OK,
    result: RESULT_FOUND,
    chatId,
  })
  expect(found.headers.get(CACHE_CONTROL_HEADER)).toBe(CACHE_CONTROL_VALUE)
  expect(JSON.stringify(foundBody)).not.toContain(apiTokenInstance)
  expect(calls).toEqual([
    {
      actualCredentials: credentials,
      query: { phoneNumber: Number(foundPhone) },
    },
  ])

  const missing = await handleSearchRequest({
    request: request({ body: JSON.stringify(validUsername) }),
    context: { configured: true, credentials },
    lookup: async () => ({ kind: RESULT_NOT_FOUND }),
    clearSession: async () => undefined,
  })
  expect(await missing.json()).toEqual({
    status: RESPONSE_OK,
    result: RESULT_NOT_FOUND,
  })
})

test('recipient-search: only confirmed invalid token clears current session', async () => {
  let cleared = 0
  const clearSession = async () => void (cleared += 1)
  const unauthorized = await handleSearchRequest({
    request: request({ body: JSON.stringify(validUsername) }),
    context: { configured: true, credentials },
    lookup: async () => ({ kind: INVALID_TOKEN }),
    clearSession,
  })
  expect(unauthorized.status).toBe(UNAUTHORIZED_STATUS)
  expect(await unauthorized.json()).toEqual({
    status: RESPONSE_ERROR,
    code: SESSION_REQUIRED,
  })
  expect(cleared).toBe(1)

  const limited = await handleSearchRequest({
    request: request({ body: JSON.stringify(validUsername) }),
    context: { configured: true, credentials },
    lookup: async () => ({ kind: RATE_LIMITED }),
    clearSession,
  })
  expect(limited.status).toBe(RATE_LIMIT_STATUS)
  expect(await limited.json()).toEqual({
    status: RESPONSE_ERROR,
    code: RATE_LIMITED,
  })
  expect(cleared).toBe(1)
})

test('recipient-search: thrown lookup becomes safe retryable error', async () => {
  const response = await handleSearchRequest({
    request: request({ body: JSON.stringify(validPhone) }),
    context: { configured: true, credentials },
    lookup: async () => {
      throw new Error(PROVIDER_DETAIL)
    },
    clearSession: async () => undefined,
  })
  expect(response.status).toBe(UNAVAILABLE_STATUS)
  expect(await response.json()).toEqual({
    status: RESPONSE_ERROR,
    code: SERVICE_UNAVAILABLE,
  })
})
