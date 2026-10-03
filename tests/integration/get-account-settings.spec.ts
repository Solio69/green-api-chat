import { expect, test } from '@playwright/test'
import { getAccountSettings } from '@/features/account/server'
import { EMPTY_STRING } from '@/lib/ui/constants'
import {
  ACCOUNT_CONTRACT,
  CREDENTIALS,
  GREEN_API_CONTRACT,
  LOGIN_API_CONTRACT,
  TEST_FETCH_CONTRACT,
  TEST_PROVIDER_FIXTURES,
  TEST_REQUEST_FIXTURES,
  TEST_TIMEOUTS,
} from '../constants'

const { ID, TOKEN } = CREDENTIALS
const credentials = { idInstance: ID, apiTokenInstance: TOKEN.trim() }
const {
  METHOD,
  PROFILE,
  UNSUPPORTED_STATUS,
  SERVER_ERROR_STATUS,
  NETWORK_ERROR,
  TIMEOUT_ERROR,
} = ACCOUNT_CONTRACT
const {
  HOST,
  INSTANCE_PREFIX,
  AUTHORIZED,
  NOT_AUTHORIZED,
  PENDING_PASSWORD,
  BLOCKED,
  SUSPENDED,
  STARTING,
  UNKNOWN,
  STARTING_MESSAGE,
  AMBIGUOUS_MESSAGE,
  EXPIRED_MESSAGE,
} = GREEN_API_CONTRACT
const {
  OK_STATUS,
  INVALID_REQUEST_STATUS,
  UNAUTHORIZED_STATUS,
  FORBIDDEN_STATUS,
  RATE_LIMIT_STATUS,
  UNAVAILABLE_STATUS,
  INVALID_TOKEN,
  INVALID_INSTANCE,
  NEEDS_AUTHORIZATION,
  INSTANCE_RESTRICTED,
  INSTANCE_EXPIRED,
  RETRY_LATER,
  RATE_LIMITED,
  SERVICE_UNAVAILABLE,
  INVALID_UPSTREAM_RESPONSE,
} = LOGIN_API_CONTRACT
const {
  METHOD_GET,
  CACHE_NO_STORE,
  REDIRECT_ERROR,
  RATE_LIMIT_DELAY_MS,
  TIMEOUT_MS,
} = TEST_FETCH_CONTRACT
const { BAD_JSON, NULL_JSON, NON_STRING_STATE, EMPTY_JSON } =
  TEST_PROVIDER_FIXTURES
const { ARRAY_JSON } = TEST_REQUEST_FIXTURES
const { EXPECT: TIMING_TOLERANCE_MS } = TEST_TIMEOUTS
const authorizedBody = {
  stateInstance: AUTHORIZED,
  username: PROFILE.label,
  avatar: PROFILE.avatarUrl,
}
const authorizedResult = {
  kind: AUTHORIZED,
  body: { stateInstance: AUTHORIZED, profile: PROFILE },
}

test('GetAccountSettings: uses its own encoded URL and safe fetch options', async () => {
  const calls: { url: string; options: RequestInit | undefined }[] = []
  const fetcher: typeof fetch = async (input, options) => {
    calls.push({ url: String(input), options })
    return Response.json(authorizedBody)
  }
  expect(await getAccountSettings({ credentials, fetcher })).toEqual(
    authorizedResult,
  )
  expect(calls).toHaveLength(1)
  expect(calls[0].url).toBe(
    `${HOST}/${INSTANCE_PREFIX}${encodeURIComponent(ID)}/${METHOD}/${encodeURIComponent(TOKEN.trim())}`,
  )
  expect(calls[0].options).toMatchObject({
    method: METHOD_GET,
    cache: CACHE_NO_STORE,
    redirect: REDIRECT_ERROR,
  })
  expect(calls[0].options?.signal).toBeInstanceOf(AbortSignal)
})

for (const stateInstance of [
  NOT_AUTHORIZED,
  PENDING_PASSWORD,
  BLOCKED,
  SUSPENDED,
  STARTING,
  UNKNOWN,
] as const) {
  test(`GetAccountSettings: classifies state ${stateInstance}`, async () => {
    let expected: unknown = { kind: INVALID_UPSTREAM_RESPONSE }
    const needsAuthorization =
      stateInstance === NOT_AUTHORIZED || stateInstance === PENDING_PASSWORD
    const isRestricted =
      stateInstance === BLOCKED || stateInstance === SUSPENDED
    if (stateInstance === STARTING) expected = { kind: RETRY_LATER }
    else if (needsAuthorization)
      expected = { kind: NEEDS_AUTHORIZATION, stateInstance }
    else if (isRestricted)
      expected = { kind: INSTANCE_RESTRICTED, stateInstance }
    expect(
      await getAccountSettings({
        credentials,
        fetcher: async () => Response.json({ stateInstance }),
      }),
    ).toEqual(expected)
  })
}

for (const { status, kind } of [
  { status: UNAUTHORIZED_STATUS, kind: INVALID_TOKEN },
  { status: FORBIDDEN_STATUS, kind: INVALID_INSTANCE },
  { status: SERVER_ERROR_STATUS, kind: SERVICE_UNAVAILABLE },
  { status: UNAVAILABLE_STATUS, kind: SERVICE_UNAVAILABLE },
  { status: UNSUPPORTED_STATUS, kind: INVALID_UPSTREAM_RESPONSE },
]) {
  test(`GetAccountSettings: classifies HTTP ${status}`, async () =>
    expect(
      await getAccountSettings({
        credentials,
        fetcher: async () => Response.json({}, { status }),
      }),
    ).toEqual({ kind }))
}

for (const { body, kind } of [
  { body: STARTING_MESSAGE, kind: RETRY_LATER },
  { body: AMBIGUOUS_MESSAGE, kind: RETRY_LATER },
  { body: EXPIRED_MESSAGE, kind: INSTANCE_EXPIRED },
  { body: BAD_JSON, kind: INVALID_UPSTREAM_RESPONSE },
]) {
  test(`GetAccountSettings: classifies HTTP 400 ${kind} ${body}`, async () =>
    expect(
      await getAccountSettings({
        credentials,
        fetcher: async () =>
          new Response(body, { status: INVALID_REQUEST_STATUS }),
      }),
    ).toEqual({ kind }))
}

test('GetAccountSettings: rejects malformed JSON and non-object or unknown states', async () => {
  for (const body of [
    BAD_JSON,
    NULL_JSON,
    ARRAY_JSON,
    EMPTY_JSON,
    NON_STRING_STATE,
  ]) {
    expect(
      await getAccountSettings({
        credentials,
        fetcher: async () => new Response(body),
      }),
    ).toEqual({ kind: INVALID_UPSTREAM_RESPONSE })
  }
})

test('GetAccountSettings: optional profile data cannot revoke authorized access', async () =>
  expect(
    await getAccountSettings({
      credentials,
      fetcher: async () =>
        Response.json({
          stateInstance: AUTHORIZED,
          username: 42,
          avatar: null,
        }),
    }),
  ).toEqual({
    kind: AUTHORIZED,
    body: {
      stateInstance: AUTHORIZED,
      profile: { label: EMPTY_STRING, avatarUrl: EMPTY_STRING },
    },
  }))

for (const error of [
  new Error(NETWORK_ERROR),
  new TypeError(NETWORK_ERROR),
  new DOMException(NETWORK_ERROR, TIMEOUT_ERROR),
]) {
  test(`GetAccountSettings: ${error.name} becomes a temporary error`, async () =>
    expect(
      await getAccountSettings({
        credentials,
        fetcher: async () => {
          throw error
        },
      }),
    ).toEqual({ kind: SERVICE_UNAVAILABLE }))
}

for (const status of [OK_STATUS, RATE_LIMIT_STATUS, UNAUTHORIZED_STATUS]) {
  test(`GetAccountSettings: retries 429 once then classifies HTTP ${status}`, async () => {
    const signals: (AbortSignal | null | undefined)[] = []
    const waits: { delay: number; signal: AbortSignal }[] = []
    const fetcher: typeof fetch = async (_input, options) => {
      signals.push(options?.signal)
      return Response.json(authorizedBody, {
        status: signals.length === 1 ? RATE_LIMIT_STATUS : status,
      })
    }
    const waitForRetry = async (options: {
      delay: number
      signal: AbortSignal
    }) => {
      waits.push(options)
    }
    const result = await getAccountSettings({
      credentials,
      fetcher,
      waitForRetry,
    })
    let expected: unknown = authorizedResult
    if (status === RATE_LIMIT_STATUS) expected = { kind: RATE_LIMITED }
    else if (status === UNAUTHORIZED_STATUS) expected = { kind: INVALID_TOKEN }
    expect(result).toEqual(expected)
    expect(signals).toHaveLength(2)
    expect(waits).toHaveLength(1)
    expect(waits[0].delay).toBe(RATE_LIMIT_DELAY_MS)
    expect(waits[0].signal).toBe(signals[0])
    expect(signals[1]).toBe(signals[0])
  })
}

test('GetAccountSettings: aborted retry stops before a second fetch', async () => {
  let calls = 0
  const result = await getAccountSettings({
    credentials,
    fetcher: async () => {
      calls += 1
      return Response.json({}, { status: RATE_LIMIT_STATUS })
    },
    waitForRetry: async () => {
      throw new DOMException(NETWORK_ERROR, TIMEOUT_ERROR)
    },
  })
  expect(result).toEqual({ kind: SERVICE_UNAVAILABLE })
  expect(calls).toBe(1)
})

test('GetAccountSettings: the real deadline aborts a stalled provider', async () => {
  const startedAt = Date.now()
  const fetcher: typeof fetch = async (_input, options) =>
    new Promise<Response>((_resolve, reject) => {
      const signal = options?.signal
      if (!signal) {
        reject(new Error(NETWORK_ERROR))
        return
      }
      signal.addEventListener('abort', () => reject(signal.reason), {
        once: true,
      })
    })
  expect(await getAccountSettings({ credentials, fetcher })).toEqual({
    kind: SERVICE_UNAVAILABLE,
  })
  expect(Date.now() - startedAt).toBeLessThan(TIMEOUT_MS + TIMING_TOLERANCE_MS)
})
