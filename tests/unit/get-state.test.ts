import { expect, test } from 'vitest'
import { getStateInstance } from '@/server/green-api/get-state'
import { EMPTY_STRING } from '@/shared/kernel/ui/constants'
import {
  CREDENTIALS,
  GREEN_API_CONTRACT,
  LOGIN_API_CONTRACT,
  TEST_FETCH_CONTRACT,
  TEST_PROVIDER_FIXTURES,
} from '../constants'

const { ID: idInstance, TOKEN: apiTokenInstance } = CREDENTIALS
const credentials = { idInstance, apiTokenInstance }
const {
  HOST,
  INSTANCE_PREFIX,
  STATE_METHOD,
  AUTHORIZED,
  NOT_AUTHORIZED,
  PENDING_PASSWORD,
  BLOCKED,
  SUSPENDED,
  STARTING,
  STARTING_MESSAGE,
  AMBIGUOUS_MESSAGE,
  EXPIRED_MESSAGE,
} = GREEN_API_CONTRACT
const {
  INVALID_TOKEN,
  INVALID_INSTANCE,
  NEEDS_AUTHORIZATION,
  INSTANCE_RESTRICTED,
  INSTANCE_EXPIRED,
  RETRY_LATER,
  RATE_LIMITED,
  SERVICE_UNAVAILABLE,
  INVALID_UPSTREAM_RESPONSE,
  UNAUTHORIZED_STATUS,
  FORBIDDEN_STATUS,
  BAD_GATEWAY_STATUS,
  UNAVAILABLE_STATUS,
  OK_STATUS,
} = LOGIN_API_CONTRACT
const {
  METHOD_GET,
  CACHE_NO_STORE,
  REDIRECT_ERROR,
  TIMEOUT_MS,
  RATE_LIMIT_DELAY_MS,
  RATE_LIMIT_STATUS,
  PROVIDER_BAD_REQUEST_STATUS,
} = TEST_FETCH_CONTRACT
const {
  DETAIL: PROVIDER_DETAIL,
  IGNORED_EXTRA,
  UNKNOWN_ERROR,
  RATE_LIMITED: RATE_LIMIT_DETAIL,
  BAD_JSON,
  EMPTY_JSON,
  NON_STRING_STATE,
  UNKNOWN_STATE,
} = TEST_PROVIDER_FIXTURES
const TEST_ERROR_MESSAGE = {
  TIMED_OUT: 'Timed out',
  TIMEOUT_NAME: 'TimeoutError',
  ABORT_SIGNAL_EXPECTED: 'Expected an aborted signal',
  UNEXPECTED_RETRY: 'Unexpected retry',
} as const
const { TIMED_OUT, TIMEOUT_NAME, ABORT_SIGNAL_EXPECTED, UNEXPECTED_RETRY } =
  TEST_ERROR_MESSAGE

test('get-state: authorized requires the documented body and fixed server URL', async () => {
  let observedUrl = EMPTY_STRING
  const fetcher: typeof fetch = async (input, init) => {
    observedUrl = String(input)
    expect(init?.method).toBe(METHOD_GET)
    expect(init?.cache).toBe(CACHE_NO_STORE)
    expect(init?.redirect).toBe(REDIRECT_ERROR)
    expect(init?.signal).toBeDefined()
    return Response.json({ stateInstance: AUTHORIZED, extra: IGNORED_EXTRA })
  }
  const result = await getStateInstance({ credentials, fetcher })
  expect(observedUrl).toBe(
    `${HOST}/${INSTANCE_PREFIX}${encodeURIComponent(idInstance)}/${STATE_METHOD}/${encodeURIComponent(apiTokenInstance)}`,
  )
  expect(result).toEqual({
    kind: AUTHORIZED,
    body: { stateInstance: AUTHORIZED },
  })
  expect(JSON.stringify(result)).not.toContain(apiTokenInstance)
})

for (const [stateInstance, kind] of [
  [NOT_AUTHORIZED, NEEDS_AUTHORIZATION],
  [PENDING_PASSWORD, NEEDS_AUTHORIZATION],
  [BLOCKED, INSTANCE_RESTRICTED],
  [SUSPENDED, INSTANCE_RESTRICTED],
  [STARTING, RETRY_LATER],
] as const) {
  test(`get-state: ${stateInstance} is ${kind}`, async () => {
    const result = await getStateInstance({
      credentials,
      fetcher: async () => Response.json({ stateInstance }),
    })
    expect(result.kind).toBe(kind)
    expect(result.kind).not.toBe(AUTHORIZED)
  })
}

for (const [status, kind] of [
  [UNAUTHORIZED_STATUS, INVALID_TOKEN],
  [FORBIDDEN_STATUS, INVALID_INSTANCE],
  [BAD_GATEWAY_STATUS, SERVICE_UNAVAILABLE],
] as const) {
  test(`get-state: HTTP ${status} is ${kind}`, async () => {
    const result = await getStateInstance({
      credentials,
      fetcher: async () => new Response(PROVIDER_DETAIL, { status }),
    })
    expect(result.kind).toBe(kind)
    expect(JSON.stringify(result)).not.toContain(PROVIDER_DETAIL)
  })
}

for (const [message, kind] of [
  [STARTING_MESSAGE, RETRY_LATER],
  [AMBIGUOUS_MESSAGE, RETRY_LATER],
  [EXPIRED_MESSAGE, INSTANCE_EXPIRED],
  [UNKNOWN_ERROR, INVALID_UPSTREAM_RESPONSE],
] as const) {
  test(`get-state: HTTP 400 ${kind} (${message})`, async () => {
    const result = await getStateInstance({
      credentials,
      fetcher: async () =>
        new Response(message, { status: PROVIDER_BAD_REQUEST_STATUS }),
    })
    expect(result.kind).toBe(kind)
  })
}

for (const body of [BAD_JSON, EMPTY_JSON, NON_STRING_STATE, UNKNOWN_STATE]) {
  test(`get-state: invalid body ${body} never authorizes`, async () => {
    const result = await getStateInstance({
      credentials,
      fetcher: async () => new Response(body, { status: OK_STATUS }),
    })
    expect(result.kind).toBe(INVALID_UPSTREAM_RESPONSE)
  })
}

test('get-state: network failure is retryable and contains no raw error', async () => {
  const result = await getStateInstance({
    credentials,
    fetcher: async () => {
      throw new Error(apiTokenInstance)
    },
  })
  expect(result.kind).toBe(SERVICE_UNAVAILABLE)
  expect(JSON.stringify(result)).not.toContain(apiTokenInstance)
})
test('get-state: times out after ten seconds with a retryable result', async () => {
  const originalTimeout = AbortSignal.timeout
  let requestedMs = 0
  AbortSignal.timeout = (delay) => {
    requestedMs = delay
    return AbortSignal.abort()
  }
  try {
    const result = await getStateInstance({
      credentials,
      fetcher: async (_input, init) => {
        if (init?.signal?.aborted) {
          throw new DOMException(TIMED_OUT, TIMEOUT_NAME)
        }
        throw new Error(ABORT_SIGNAL_EXPECTED)
      },
    })
    expect(requestedMs).toBe(TIMEOUT_MS)
    expect(result).toEqual({ kind: SERVICE_UNAVAILABLE })
  } finally {
    AbortSignal.timeout = originalTimeout
  }
})

test('get-state: retries HTTP 429 once before accepting authorized state', async () => {
  let calls = 0
  const signals: (AbortSignal | null | undefined)[] = []
  const waits: number[] = []
  const result = await getStateInstance({
    credentials,
    fetcher: async (_input, init) => {
      calls += 1
      signals.push(init?.signal)
      return calls === 1
        ? new Response(RATE_LIMIT_DETAIL, { status: RATE_LIMIT_STATUS })
        : Response.json({ stateInstance: AUTHORIZED })
    },
    waitForRetry: async ({ delay, signal }) => {
      waits.push(delay)
      expect(signal).toBe(signals[0])
    },
  })
  expect(calls).toBe(2)
  expect(waits).toEqual([RATE_LIMIT_DELAY_MS])
  expect(signals[1]).toBe(signals[0])
  expect(result).toEqual({
    kind: AUTHORIZED,
    body: { stateInstance: AUTHORIZED },
  })
  expect(JSON.stringify(result)).not.toContain(apiTokenInstance)
})

test('get-state: a second HTTP 429 stops after one retry', async () => {
  let calls = 0
  let waits = 0
  const result = await getStateInstance({
    credentials,
    fetcher: async () => {
      calls += 1
      return new Response(PROVIDER_DETAIL, { status: RATE_LIMIT_STATUS })
    },
    waitForRetry: async () => void (waits += 1),
  })
  expect(calls).toBe(2)
  expect(waits).toBe(1)
  expect(result).toEqual({ kind: RATE_LIMITED })
  expect(JSON.stringify(result)).not.toContain(PROVIDER_DETAIL)
})

test('get-state: other failures do not trigger a delayed retry', async () => {
  let calls = 0
  const result = await getStateInstance({
    credentials,
    fetcher: async () => {
      calls += 1
      return new Response(PROVIDER_DETAIL, { status: UNAVAILABLE_STATUS })
    },
    waitForRetry: async () => {
      throw new Error(UNEXPECTED_RETRY)
    },
  })
  expect(calls).toBe(1)
  expect(result).toEqual({ kind: SERVICE_UNAVAILABLE })
})
