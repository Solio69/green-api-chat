import { createHmac } from 'node:crypto'
import { expect, test } from 'vitest'
import { getQueryScope } from '@/features/auth/server'
import { normalizeChats } from '@/features/chats/model'
import type { ChatsErrorCode } from '@/features/chats/model'
import { handleChatsRequest } from '@/features/chats/server'
import type { GetChatsResult } from '@/features/chats/server'
import { getChats } from '@/lib/green-api/get-chats'
import { EMPTY_STRING } from '@/lib/ui/constants'
import { CHAT_FIXTURES } from '../chats/constants'
import {
  TEST_PROVIDER_PROTOCOL,
  TEST_API_RESPONSE,
  TEST_HTTP_PROTOCOL,
  TEST_API_CODE,
} from '../protocol.constants'

const CHAT_REQUEST_URL = 'http://localhost/api/chats'
const EXPECTED_PROVIDER_URL =
  'https://4100.api.green-api.com/waInstance99001401/getChats/fictional-token-for-chat-list'

const {
  GROUP: TEST_PROVIDER_PROTOCOL_GROUP,
  USER: TEST_PROVIDER_PROTOCOL_USER,
} = TEST_PROVIDER_PROTOCOL
const { OK: TEST_API_RESPONSE_OK, ERROR: TEST_API_RESPONSE_ERROR } =
  TEST_API_RESPONSE
const { GET: TEST_HTTP_PROTOCOL_GET, NO_STORE: TEST_HTTP_PROTOCOL_NO_STORE } =
  TEST_HTTP_PROTOCOL
const {
  INVALID_TOKEN: TEST_API_CODE_INVALID_TOKEN,
  INVALID_INSTANCE: TEST_API_CODE_INVALID_INSTANCE,
  SERVICE_UNAVAILABLE: TEST_API_CODE_SERVICE_UNAVAILABLE,
  INVALID_UPSTREAM_RESPONSE: TEST_API_CODE_INVALID_UPSTREAM_RESPONSE,
  INSTANCE_EXPIRED: TEST_API_CODE_INSTANCE_EXPIRED,
  RETRY_LATER: TEST_API_CODE_RETRY_LATER,
  RATE_LIMITED: TEST_API_CODE_RATE_LIMITED,
  SESSION_REQUIRED: TEST_API_CODE_SESSION_REQUIRED,
  CONNECTION_CHANGED: TEST_API_CODE_CONNECTION_CHANGED,
  NEEDS_AUTHORIZATION: TEST_API_CODE_NEEDS_AUTHORIZATION,
  INSTANCE_RESTRICTED: TEST_API_CODE_INSTANCE_RESTRICTED,
} = TEST_API_CODE

const { credentials, scopeA, scopeB, chat, provider } = CHAT_FIXTURES
const context = { configured: true, credentials, connectionScope: scopeA }
const request = (scope = scopeA) =>
  new Request(CHAT_REQUEST_URL, {
    headers: { 'X-Connection-Scope': scope },
  })
const fakeFetch =
  ({ body, status = 200 }: { body: unknown; status?: number }): typeof fetch =>
  async () =>
    Response.json(body, { status })

test('chats: personal normalization, order, first duplicate and allowlist', () => {
  const value = [
    ...provider,
    { chatId: 'g', type: TEST_PROVIDER_PROTOCOL_GROUP },
    { chatId: 's', type: 'supergroup' },
    { chatId: 'c', type: 'channel' },
    { type: 'future' },
    { chatId: 'chat-1', type: TEST_PROVIDER_PROTOCOL_USER, name: 'duplicate' },
    {
      chatId: 'chat-2',
      type: TEST_PROVIDER_PROTOCOL_USER,
      name: ' ',
      phoneNumber: 15551234567,
      extra: credentials,
    },
  ]
  expect(normalizeChats({ value, credentials })).toEqual([
    chat,
    { chatId: 'chat-2', name: null, username: null, phone: '15551234567' },
  ])
})
for (const value of [
  [],
  [{ type: TEST_PROVIDER_PROTOCOL_GROUP }],
  [{ type: 'future' }],
]) {
  test(`chats: valid empty ${JSON.stringify(value)}`, () =>
    expect(normalizeChats({ value, credentials })).toEqual([]))
}
for (const value of [
  {},
  null,
  [null],
  [[]],
  [{}],
  [{ type: 1 }],
  [{ type: ' ' }],
  [{ type: TEST_PROVIDER_PROTOCOL_USER }],
  [{ type: TEST_PROVIDER_PROTOCOL_USER, chatId: 12 }],
]) {
  test(`chats: malformed ${JSON.stringify(value)}`, () =>
    expect(normalizeChats({ value, credentials })).toBeNull())
}
test('chats: optional malformed fields and credential-bearing text are removed', () => {
  const value = [
    {
      type: TEST_PROVIDER_PROTOCOL_USER,
      chatId: 'chat-1',
      name: credentials.apiTokenInstance,
      username: `https://demo/${encodeURIComponent(credentials.idInstance)}`,
      phoneNumber: -1,
    },
  ]
  expect(normalizeChats({ value, credentials })).toEqual([
    { chatId: 'chat-1', name: null, username: null, phone: null },
  ])
  expect(
    normalizeChats({
      value: [
        { type: TEST_PROVIDER_PROTOCOL_USER, chatId: credentials.idInstance },
      ],
      credentials,
    }),
  ).toBeNull()
})
test('chats: scope uses independently computed protocol and changes with connection', () => {
  const session = { ...credentials, expiresAt: 123456789 }
  const password = 'fictional-password-for-query-scopes-only'
  const expected = createHmac('sha256', password)
    .update(
      JSON.stringify([
        'chat-query-v1',
        credentials.idInstance,
        credentials.apiTokenInstance,
        123456789,
      ]),
    )
    .digest('base64url')
  expect(getQueryScope({ session, password })).toBe(expected)
  expect(
    getQueryScope({ session: { ...session, expiresAt: 123456790 }, password }),
  ).not.toBe(expected)
  expect(
    getQueryScope({
      session: { ...session, apiTokenInstance: 'other' },
      password,
    }),
  ).not.toBe(expected)
  expect(expected).toMatch(/^[A-Za-z0-9_-]{43}$/)
})
test('chats: provider GET uses fixed host, encoded credentials, abort and no-store', async () => {
  let seen: { input: string; init?: RequestInit } | undefined
  const fetcher: typeof fetch = async (input, init) => {
    seen = { input: String(input), init }
    return Response.json(provider)
  }
  expect(await getChats({ credentials, fetcher })).toEqual({
    kind: TEST_API_RESPONSE_OK,
    chats: [chat],
  })
  expect(seen?.input).toBe(EXPECTED_PROVIDER_URL)
  expect(seen?.init).toMatchObject({
    method: TEST_HTTP_PROTOCOL_GET,
    cache: TEST_HTTP_PROTOCOL_NO_STORE,
    redirect: TEST_API_RESPONSE_ERROR,
  })
  expect(seen?.init?.signal).toBeInstanceOf(AbortSignal)
})
for (const [status, kind] of [
  [401, TEST_API_CODE_INVALID_TOKEN],
  [403, TEST_API_CODE_INVALID_INSTANCE],
  [503, TEST_API_CODE_SERVICE_UNAVAILABLE],
  [418, TEST_API_CODE_INVALID_UPSTREAM_RESPONSE],
] as const) {
  test(`chats: provider status ${status}`, async () =>
    expect(
      await getChats({ credentials, fetcher: fakeFetch({ body: {}, status }) }),
    ).toEqual({ kind }))
}
test('chats: provider malformed JSON/root and network failure preserve category', async () => {
  expect(
    await getChats({
      credentials,
      fetcher: async () => new Response('broken'),
    }),
  ).toEqual({ kind: TEST_API_CODE_INVALID_UPSTREAM_RESPONSE })
  expect(
    await getChats({ credentials, fetcher: fakeFetch({ body: {} }) }),
  ).toEqual({ kind: TEST_API_CODE_INVALID_UPSTREAM_RESPONSE })
  expect(
    await getChats({
      credentials,
      fetcher: async () => {
        throw new Error('network')
      },
    }),
  ).toEqual({ kind: TEST_API_CODE_SERVICE_UNAVAILABLE })
})
test('chats: provider expired/starting 400 follow existing categories', async () => {
  expect(
    await getChats({
      credentials,
      fetcher: async () =>
        new Response(
          'Instance account is expired. Renew your instance from personal area',
          { status: 400 },
        ),
    }),
  ).toEqual({ kind: TEST_API_CODE_INSTANCE_EXPIRED })
  expect(
    await getChats({
      credentials,
      fetcher: async () =>
        new Response('instance in starting process try later', { status: 400 }),
    }),
  ).toEqual({ kind: TEST_API_CODE_RETRY_LATER })
})
for (const success of [true, false]) {
  test(`chats: one rate-limit retry, success=${success}`, async () => {
    let calls = 0
    let waits = 0
    let firstSignal: AbortSignal | null | undefined
    const fetcher: typeof fetch = async (_input, init) => {
      calls += 1
      if (calls === 1) firstSignal = init?.signal
      else expect(init?.signal).toBe(firstSignal)
      return calls === 2 && success
        ? Response.json(provider)
        : Response.json({}, { status: 429 })
    }
    const result = await getChats({
      credentials,
      fetcher,
      waitForRetry: async ({ delay, signal }) => {
        waits += 1
        expect(delay).toBe(1100)
        expect(signal).toBe(firstSignal)
      },
    })
    expect(result).toEqual(
      success
        ? { kind: TEST_API_RESPONSE_OK, chats: [chat] }
        : { kind: TEST_API_CODE_RATE_LIMITED },
    )
    expect(calls).toBe(2)
    expect(waits).toBe(1)
  })
}
test('chats: aborted signal prevents initial call and retry', async () => {
  const controller = new AbortController()
  controller.abort()
  let calls = 0
  await getChats({
    credentials,
    signal: controller.signal,
    fetcher: async () => {
      calls += 1
      return Response.json(provider)
    },
  })
  expect(calls).toBe(0)
  const pending = new AbortController()
  await getChats({
    credentials,
    signal: pending.signal,
    fetcher: async () => {
      calls += 1
      return Response.json({}, { status: 429 })
    },
    waitForRetry: async () => {
      pending.abort()
    },
  })
  expect(calls).toBe(1)
})
for (const [override, scope, status, code] of [
  [{ configured: false }, scopeA, 503, 'server_unavailable'],
  [{ credentials: null }, scopeA, 401, TEST_API_CODE_SESSION_REQUIRED],
  [{}, EMPTY_STRING, 400, 'invalid_request'],
  [{}, scopeB, 409, TEST_API_CODE_CONNECTION_CHANGED],
] as const) {
  test(`chats: rejects before provider ${code}`, async () => {
    let calls = 0
    let clears = 0
    const response = await handleChatsRequest({
      request: request(scope),
      context: { ...context, ...override },
      lookup: async () => {
        calls += 1
        return { kind: TEST_API_RESPONSE_OK, chats: [chat] }
      },
      clearSession: async () => {
        clears += 1
      },
    })
    expect(response.status).toBe(status)
    expect(await response.json()).toEqual({
      status: TEST_API_RESPONSE_ERROR,
      code,
    })
    expect(response.headers.get('Cache-Control')).toBe(
      TEST_HTTP_PROTOCOL_NO_STORE,
    )
    expect(calls).toBe(0)
    expect(clears).toBe(code === TEST_API_CODE_SESSION_REQUIRED ? 1 : 0)
  })
}
test('chats: internal success is safe and scoped', async () => {
  const response = await handleChatsRequest({
    request: request(),
    context,
    lookup: async ({ credentials: actual, signal }) => {
      expect(actual).toEqual(credentials)
      expect(signal).toBeInstanceOf(AbortSignal)
      return { kind: TEST_API_RESPONSE_OK, chats: [chat] }
    },
    clearSession: async () => {
      throw new Error('must preserve')
    },
  })
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({
    status: TEST_API_RESPONSE_OK,
    connectionScope: scopeA,
    chats: [chat],
  })
  expect(response.headers.get('Cache-Control')).toBe(
    TEST_HTTP_PROTOCOL_NO_STORE,
  )
})
for (const [kind, status, code, shouldClear] of [
  [TEST_API_CODE_INVALID_TOKEN, 401, TEST_API_CODE_SESSION_REQUIRED, true],
  [TEST_API_CODE_INVALID_INSTANCE, 401, TEST_API_CODE_SESSION_REQUIRED, true],
  [TEST_API_CODE_INSTANCE_EXPIRED, 401, TEST_API_CODE_SESSION_REQUIRED, true],
  [
    TEST_API_CODE_NEEDS_AUTHORIZATION,
    401,
    TEST_API_CODE_SESSION_REQUIRED,
    true,
  ],
  [
    TEST_API_CODE_INSTANCE_RESTRICTED,
    401,
    TEST_API_CODE_SESSION_REQUIRED,
    true,
  ],
  [TEST_API_CODE_RATE_LIMITED, 429, TEST_API_CODE_RATE_LIMITED, false],
  [TEST_API_CODE_RETRY_LATER, 503, TEST_API_CODE_RETRY_LATER, false],
  [
    TEST_API_CODE_SERVICE_UNAVAILABLE,
    503,
    TEST_API_CODE_SERVICE_UNAVAILABLE,
    false,
  ],
  [
    TEST_API_CODE_INVALID_UPSTREAM_RESPONSE,
    502,
    TEST_API_CODE_INVALID_UPSTREAM_RESPONSE,
    false,
  ],
] as const) {
  test(`chats: HTTP error and cookie ${kind}`, async () => {
    let clears = 0
    const response = await handleChatsRequest({
      request: request(),
      context,
      lookup: async (): Promise<GetChatsResult> => ({
        kind: kind satisfies ChatsErrorCode,
      }),
      clearSession: async () => {
        clears += 1
      },
    })
    expect(response.status).toBe(status)
    expect(await response.json()).toEqual({
      status: TEST_API_RESPONSE_ERROR,
      code,
    })
    expect(clears).toBe(shouldClear ? 1 : 0)
  })
}

test('chats: deadline aborts an unresponsive provider', async () => {
  let timeout = false
  const result = await getChats({
    credentials,
    fetcher: async (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener(
          'abort',
          () => {
            timeout = true
            reject(new Error('fictional timeout'))
          },
          { once: true },
        )
      }),
  })
  expect(result).toEqual({ kind: TEST_API_CODE_SERVICE_UNAVAILABLE })
  expect(timeout).toBe(true)
})

test('chats: failed cookie cleanup never confirms logout of session', async () => {
  const response = await handleChatsRequest({
    request: request(),
    context,
    lookup: async () => ({ kind: TEST_API_CODE_INVALID_TOKEN }),
    clearSession: async () => {
      throw new Error('fictional cleanup failure')
    },
  })
  expect(response.status).toBe(503)
  expect(await response.json()).toEqual({
    status: TEST_API_RESPONSE_ERROR,
    code: TEST_API_CODE_SERVICE_UNAVAILABLE,
  })
})

test('chats: cancellation during provider body prevents a late success', async () => {
  const body = Promise.withResolvers<string>()
  const controller = new AbortController()
  let reading = false
  const response = Response.json(provider)
  response.text = () => {
    reading = true
    return body.promise
  }
  const pending = getChats({
    credentials,
    signal: controller.signal,
    fetcher: async () => response,
  })
  await expect.poll(() => reading).toBe(true)
  controller.abort()
  body.resolve(JSON.stringify(provider))
  expect(await pending).toEqual({ kind: TEST_API_CODE_SERVICE_UNAVAILABLE })
})
