import { createHmac } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { getQueryScope } from '@/lib/auth/get-query-scope'
import { handleChatsRequest } from '@/lib/chats/handle-chats-request'
import { normalizeChats } from '@/lib/chats/normalize-chats'
import type { GetChatsResult, ChatsErrorCode } from '@/lib/chats/types'
import { getChats } from '@/lib/green-api/get-chats'
import { EMPTY_STRING } from '@/lib/ui/constants'
import { CHAT_FIXTURES } from '../chats/constants'

const { credentials, scopeA, scopeB, chat, provider } = CHAT_FIXTURES
const context = { configured: true, credentials, connectionScope: scopeA }
const request = (scope = scopeA) =>
  new Request('http://localhost/api/chats', {
    headers: { 'X-Connection-Scope': scope },
  })
const fakeFetch =
  ({ body, status = 200 }: { body: unknown; status?: number }): typeof fetch =>
  async () =>
    Response.json(body, { status })

test('chats: personal normalization, order, first duplicate and allowlist', () => {
  const value = [
    ...provider,
    { chatId: 'g', type: 'group' },
    { chatId: 's', type: 'supergroup' },
    { chatId: 'c', type: 'channel' },
    { type: 'future' },
    { chatId: 'chat-1', type: 'user', name: 'duplicate' },
    {
      chatId: 'chat-2',
      type: 'user',
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
for (const value of [[], [{ type: 'group' }], [{ type: 'future' }]]) {
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
  [{ type: 'user' }],
  [{ type: 'user', chatId: 12 }],
]) {
  test(`chats: malformed ${JSON.stringify(value)}`, () =>
    expect(normalizeChats({ value, credentials })).toBeNull())
}
test('chats: optional malformed fields and credential-bearing text are removed', () => {
  const value = [
    {
      type: 'user',
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
      value: [{ type: 'user', chatId: credentials.idInstance }],
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
    kind: 'ok',
    chats: [chat],
  })
  expect(seen?.input).toBe(
    'https://4100.api.green-api.com/waInstance99001401/getChats/fictional-token-for-chat-list',
  )
  expect(seen?.init).toMatchObject({
    method: 'GET',
    cache: 'no-store',
    redirect: 'error',
  })
  expect(seen?.init?.signal).toBeInstanceOf(AbortSignal)
})
for (const [status, kind] of [
  [401, 'invalid_token'],
  [403, 'invalid_instance'],
  [503, 'service_unavailable'],
  [418, 'invalid_upstream_response'],
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
  ).toEqual({ kind: 'invalid_upstream_response' })
  expect(
    await getChats({ credentials, fetcher: fakeFetch({ body: {} }) }),
  ).toEqual({ kind: 'invalid_upstream_response' })
  expect(
    await getChats({
      credentials,
      fetcher: async () => {
        throw new Error('network')
      },
    }),
  ).toEqual({ kind: 'service_unavailable' })
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
  ).toEqual({ kind: 'instance_expired' })
  expect(
    await getChats({
      credentials,
      fetcher: async () =>
        new Response('instance in starting process try later', { status: 400 }),
    }),
  ).toEqual({ kind: 'retry_later' })
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
      success ? { kind: 'ok', chats: [chat] } : { kind: 'rate_limited' },
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
  [{ credentials: null }, scopeA, 401, 'session_required'],
  [{}, EMPTY_STRING, 400, 'invalid_request'],
  [{}, scopeB, 409, 'connection_changed'],
] as const) {
  test(`chats: rejects before provider ${code}`, async () => {
    let calls = 0
    let clears = 0
    const response = await handleChatsRequest({
      request: request(scope),
      context: { ...context, ...override },
      lookup: async () => {
        calls += 1
        return { kind: 'ok', chats: [chat] }
      },
      clearSession: async () => {
        clears += 1
      },
    })
    expect(response.status).toBe(status)
    expect(await response.json()).toEqual({ status: 'error', code })
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(calls).toBe(0)
    expect(clears).toBe(code === 'session_required' ? 1 : 0)
  })
}
test('chats: internal success is safe and scoped', async () => {
  const response = await handleChatsRequest({
    request: request(),
    context,
    lookup: async ({ credentials: actual, signal }) => {
      expect(actual).toEqual(credentials)
      expect(signal).toBeInstanceOf(AbortSignal)
      return { kind: 'ok', chats: [chat] }
    },
    clearSession: async () => {
      throw new Error('must preserve')
    },
  })
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({
    status: 'ok',
    connectionScope: scopeA,
    chats: [chat],
  })
  expect(response.headers.get('Cache-Control')).toBe('no-store')
})
for (const [kind, status, code, shouldClear] of [
  ['invalid_token', 401, 'session_required', true],
  ['invalid_instance', 401, 'session_required', true],
  ['instance_expired', 401, 'session_required', true],
  ['needs_authorization', 401, 'session_required', true],
  ['instance_restricted', 401, 'session_required', true],
  ['rate_limited', 429, 'rate_limited', false],
  ['retry_later', 503, 'retry_later', false],
  ['service_unavailable', 503, 'service_unavailable', false],
  ['invalid_upstream_response', 502, 'invalid_upstream_response', false],
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
    expect(await response.json()).toEqual({ status: 'error', code })
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
  expect(result).toEqual({ kind: 'service_unavailable' })
  expect(timeout).toBe(true)
})

test('chats: failed cookie cleanup never confirms logout of session', async () => {
  const response = await handleChatsRequest({
    request: request(),
    context,
    lookup: async () => ({ kind: 'invalid_token' }),
    clearSession: async () => {
      throw new Error('fictional cleanup failure')
    },
  })
  expect(response.status).toBe(503)
  expect(await response.json()).toEqual({
    status: 'error',
    code: 'service_unavailable',
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
  expect(await pending).toEqual({ kind: 'service_unavailable' })
})
