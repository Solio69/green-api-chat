import { expect, test } from '@playwright/test'
import { checkAccount } from '@/lib/green-api/check-account'
import type { InstanceCredentials } from '@/lib/green-api/get-state'
import { HTTP_HEADERS } from '@/lib/http/constants'
import { EMPTY_STRING } from '@/lib/ui/constants'
import {
  CREDENTIALS,
  GREEN_API_CONTRACT,
  LOGIN_API_CONTRACT,
  RECIPIENT_API_CONTRACT,
  RECIPIENT_SCENARIOS,
  TEST_FETCH_CONTRACT,
  TEST_PROVIDER_FIXTURES,
} from '../constants'

const { ID: idInstance, TOKEN: apiTokenInstance } = CREDENTIALS
const credentials: InstanceCredentials = { idInstance, apiTokenInstance }
const { HOST, INSTANCE_PREFIX, SEARCH_METHOD, STARTING_MESSAGE } =
  GREEN_API_CONTRACT
const { CONTENT_TYPE } = HTTP_HEADERS
const {
  OK_STATUS,
  UNAUTHORIZED_STATUS,
  FORBIDDEN_STATUS,
  RATE_LIMIT_STATUS,
  UNAVAILABLE_STATUS,
  JSON_CONTENT_TYPE,
  INVALID_TOKEN,
  RATE_LIMITED,
  SERVICE_UNAVAILABLE,
  INVALID_UPSTREAM_RESPONSE,
  INVALID_REQUEST_STATUS,
  RETRY_LATER,
} = LOGIN_API_CONTRACT
const {
  RESULT_FOUND,
  RESULT_NOT_FOUND,
  RATE_LIMIT_REASON,
  PROVIDER_RATE_LIMIT_STATUS,
} = RECIPIENT_API_CONTRACT
const { foundPhone, foundUsername, chatId } = RECIPIENT_SCENARIOS
const { METHOD_POST, CACHE_NO_STORE, REDIRECT_ERROR } = TEST_FETCH_CONTRACT
const { BAD_JSON } = TEST_PROVIDER_FIXTURES

type FetchCall = { url: string; init: RequestInit }

const createFetcher = (body: unknown, status: number = OK_STATUS) => {
  const calls: FetchCall[] = []
  const fetcher = (async (url: URL | RequestInfo, init: RequestInit = {}) => {
    calls.push({ url: String(url), init })
    return Response.json(body, { status })
  }) as typeof fetch
  return { fetcher, calls }
}

test('check-account: phone lookup uses one fixed-host POST and exposes only chatId', async () => {
  const { fetcher, calls } = createFetcher({ exist: true, chatId })
  const result = await checkAccount(
    credentials,
    { phoneNumber: Number(foundPhone) },
    fetcher,
  )

  expect(result).toEqual({ kind: RESULT_FOUND, chatId })
  expect(calls).toHaveLength(1)
  expect(calls[0].url).toBe(
    `${HOST}/${INSTANCE_PREFIX}${encodeURIComponent(idInstance)}/${SEARCH_METHOD}/${encodeURIComponent(apiTokenInstance)}`,
  )
  expect(calls[0].init.method).toBe(METHOD_POST)
  expect(calls[0].init.cache).toBe(CACHE_NO_STORE)
  expect(calls[0].init.redirect).toBe(REDIRECT_ERROR)
  expect(calls[0].init.headers).toEqual({ [CONTENT_TYPE]: JSON_CONTENT_TYPE })
  expect(JSON.parse(String(calls[0].init.body))).toEqual({
    phoneNumber: Number(foundPhone),
  })
  expect(JSON.stringify(result)).not.toContain(apiTokenInstance)
})

test('check-account: username lookup sends @ and distinguishes not found', async () => {
  const { fetcher, calls } = createFetcher({ exist: false })
  const result = await checkAccount(
    credentials,
    { username: `@${foundUsername}` },
    fetcher,
  )
  expect(result).toEqual({ kind: RESULT_NOT_FOUND })
  expect(calls).toHaveLength(1)
  expect(JSON.parse(String(calls[0].init.body))).toEqual({
    username: `@${foundUsername}`,
  })
})

test('check-account: limit in HTTP 200 and HTTP 429/469 is not absence', async () => {
  for (const [body, status] of [
    [{ status: false, data: { reason: RATE_LIMIT_REASON } }, OK_STATUS],
    [{}, RATE_LIMIT_STATUS],
    [{}, PROVIDER_RATE_LIMIT_STATUS],
  ] as const) {
    const { fetcher } = createFetcher(body, status)
    expect(
      await checkAccount(
        credentials,
        { username: `@${foundUsername}` },
        fetcher,
      ),
    ).toEqual({ kind: RATE_LIMITED })
  }
})

test('check-account: only HTTP 401 proves invalid token', async () => {
  const unauthorized = createFetcher({}, UNAUTHORIZED_STATUS)
  expect(
    await checkAccount(
      credentials,
      { username: `@${foundUsername}` },
      unauthorized.fetcher,
    ),
  ).toEqual({ kind: INVALID_TOKEN })

  const forbidden = createFetcher({}, FORBIDDEN_STATUS)
  expect(
    await checkAccount(
      credentials,
      { username: `@${foundUsername}` },
      forbidden.fetcher,
    ),
  ).toEqual({ kind: INVALID_UPSTREAM_RESPONSE })
})

test('check-account: documented startup is retryable, other HTTP 400 is not', async () => {
  const startup = (async () =>
    new Response(STARTING_MESSAGE, {
      status: INVALID_REQUEST_STATUS,
    })) as typeof fetch
  expect(
    await checkAccount(
      credentials,
      { phoneNumber: Number(foundPhone) },
      startup,
    ),
  ).toEqual({ kind: RETRY_LATER })
  const unknown = (async () =>
    new Response(TEST_PROVIDER_FIXTURES.UNKNOWN_ERROR, {
      status: INVALID_REQUEST_STATUS,
    })) as typeof fetch
  expect(
    await checkAccount(
      credentials,
      { phoneNumber: Number(foundPhone) },
      unknown,
    ),
  ).toEqual({ kind: INVALID_UPSTREAM_RESPONSE })
})

test('check-account: incomplete or unknown body never confirms a recipient', async () => {
  for (const body of [
    { exist: true },
    { exist: true, chatId: EMPTY_STRING },
    { exist: true, chatId: 42 },
    { status: false },
    { status: false, data: { reason: TEST_PROVIDER_FIXTURES.UNKNOWN_ERROR } },
    {},
  ]) {
    const { fetcher } = createFetcher(body)
    expect(
      await checkAccount(
        credentials,
        { phoneNumber: Number(foundPhone) },
        fetcher,
      ),
    ).toEqual({ kind: INVALID_UPSTREAM_RESPONSE })
  }
  const malformed = (async () =>
    new Response(BAD_JSON, { status: OK_STATUS })) as typeof fetch
  expect(
    await checkAccount(
      credentials,
      { phoneNumber: Number(foundPhone) },
      malformed,
    ),
  ).toEqual({ kind: INVALID_UPSTREAM_RESPONSE })
})

test('check-account: provider outage and transport failure are retryable', async () => {
  const unavailable = createFetcher({}, UNAVAILABLE_STATUS)
  expect(
    await checkAccount(
      credentials,
      { phoneNumber: Number(foundPhone) },
      unavailable.fetcher,
    ),
  ).toEqual({ kind: SERVICE_UNAVAILABLE })
  const networkFailure = (async () => {
    throw new Error(TEST_PROVIDER_FIXTURES.DETAIL)
  }) as typeof fetch
  expect(
    await checkAccount(
      credentials,
      { phoneNumber: Number(foundPhone) },
      networkFailure,
    ),
  ).toEqual({ kind: SERVICE_UNAVAILABLE })
})
