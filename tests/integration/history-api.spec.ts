import { expect, test } from '@playwright/test'
import { NextRequest } from 'next/server'
import { getChatHistory } from '@/lib/green-api/get-chat-history'
import { handleHistoryRequest } from '@/lib/history/handle-history-request'
import type { HistoryRequestOptions } from '@/lib/history/handle-history-request'
import { normalizeHistory } from '@/lib/history/normalize-history'
import { validateHistoryRequest } from '@/lib/history/validate-history-request'
import { HTTP_HEADERS } from '@/lib/http/constants'
import { EMPTY_STRING } from '@/lib/ui/constants'
import { HISTORY_TEST } from '../history/constants'

const {
  API,
  ORIGIN,
  CACHE_HEADER,
  NO_STORE,
  METHOD,
  CONTENT_TYPE,
  COUNT,
  SUCCESS,
  ERROR,
  scopeA,
  scopeB,
  credentials,
  chatA,
  chatB,
  raw,
  message,
  STATUS,
  CODE,
  INVALID_ORIGINS,
  HTTP,
  MEDIA_ID,
  PROVIDER,
  PROVIDER_METHOD,
  RAW_SECRET,
  MESSAGE,
  TARGET_ORIGIN,
  TARGET_HOST,
  REWRITTEN_ORIGIN,
  HOST_HEADER,
  MALFORMED_HOSTS,
} = HISTORY_TEST
const { ORIGIN: ORIGIN_HEADER, CONNECTION_SCOPE: REQUEST_SCOPE_HEADER } =
  HTTP_HEADERS
const {
  OK,
  BAD_REQUEST,
  UNAUTHORIZED,
  FORBIDDEN,
  CONFLICT,
  RATE_LIMITED,
  BAD_GATEWAY,
  UNAVAILABLE,
} = STATUS
const { INVALID, SESSION, CHANGED, UPSTREAM } = CODE
const makeRequest = (
  options: {
    body?: unknown
    origin?: string | null
    scope?: string
  } = {},
) => {
  const { body = { chatId: chatA }, origin = ORIGIN, scope = scopeA } = options
  const headers: Record<string, string> = { [REQUEST_SCOPE_HEADER]: scope }
  if (origin !== null) headers[ORIGIN_HEADER] = origin
  return new Request(`${ORIGIN}${API}`, {
    method: METHOD,
    headers,
    body: JSON.stringify(body),
  })
}
const runHandler = async (options: Partial<HistoryRequestOptions> = {}) => {
  let calls = 0
  let clears = 0
  const result = await handleHistoryRequest({
    request: makeRequest(),
    context: { configured: true, credentials, connectionScope: scopeA },
    lookup: async () => {
      calls += 1
      return { kind: SUCCESS, messages: [message] }
    },
    clearSession: async () => {
      clears += 1
    },
    ...options,
  })
  return { result, calls, clears }
}
const makeNextRequest = ({
  origin = TARGET_ORIGIN,
  host = TARGET_HOST,
}: {
  origin?: string
  host?: string
} = {}) =>
  new NextRequest(`${TARGET_ORIGIN}${API}`, {
    method: METHOD,
    headers: {
      [REQUEST_SCOPE_HEADER]: scopeA,
      [ORIGIN_HEADER]: origin,
      [HOST_HEADER]: host,
    },
    body: JSON.stringify({ chatId: chatA }),
  })
test('history target Origin: actual loopback Host wins over normalized NextRequest URL', async () => {
  const request = makeNextRequest()
  expect(new URL(request.url).origin).toBe(REWRITTEN_ORIGIN)
  const { result, calls, clears } = await runHandler({ request })
  expect(result.status).toBe(OK)
  expect([calls, clears]).toEqual([1, 0])
})
test('history target Origin: normalized localhost is foreign to actual loopback Host', async () => {
  const { result, calls, clears } = await runHandler({
    request: makeNextRequest({ origin: REWRITTEN_ORIGIN }),
  })
  expect(result.status).toBe(FORBIDDEN)
  expect(await result.json()).toEqual({ status: ERROR, code: INVALID })
  expect([calls, clears]).toEqual([0, 0])
})
test('history target Origin: malformed Host never permits normalized URL fallback', async () => {
  for (const host of MALFORMED_HOSTS) {
    const { result, calls, clears } = await runHandler({
      request: makeNextRequest({ origin: REWRITTEN_ORIGIN, host }),
    })
    expect(result.status).toBe(FORBIDDEN)
    expect([calls, clears]).toEqual([0, 0])
  }
})
test('history target Origin: path, query, fragment and non HTTP origin remain invalid', async () => {
  for (const origin of [
    `${ORIGIN}/path`,
    `${ORIGIN}?query=1`,
    `${ORIGIN}#fragment`,
    'ftp://app.example.test',
  ]) {
    const { result, calls, clears } = await runHandler({
      request: makeRequest({ origin }),
    })
    expect(result.status).toBe(FORBIDDEN)
    expect([calls, clears]).toEqual([0, 0])
  }
})
test('history request: only the confirmed personal chat identifier is accepted', () => {
  expect(validateHistoryRequest({ chatId: chatA })).toEqual({ chatId: chatA })
  for (const value of [
    null,
    [],
    {},
    { chatId: EMPTY_STRING },
    { chatId: ' chat ' },
    { chatId: '-1' },
    { chatId: '1@g.us' },
    { chatId: '1@c.us' },
    { chatId: 'bad\nchat' },
    { chatId: chatA, count: COUNT },
    { chatId: chatA, apiTokenInstance: credentials.apiTokenInstance },
  ])
    expect(validateHistoryRequest(value)).toBeNull()
})
test('history normalizes text, unsupported messages, timestamps and status without raw metadata', () => {
  const value = [
    {
      ...raw,
      downloadUrl: 'https://example.test/private',
      senderPhoneNumber: 'fictional-phone',
    },
    {
      ...raw,
      idMessage: MEDIA_ID,
      type: MESSAGE.OUTGOING,
      typeMessage: PROVIDER.IMAGE,
      statusMessage: MESSAGE.READ,
      timestamp: 200,
    },
  ]
  expect(normalizeHistory({ value, chatId: chatA, credentials })).toEqual([
    message,
    {
      ...message,
      idMessage: MEDIA_ID,
      direction: MESSAGE.OUTGOING,
      kind: MESSAGE.UNSUPPORTED,
      text: null,
      status: MESSAGE.READ,
      timestamp: 200,
    },
  ])
  expect(normalizeHistory({ value: [], chatId: chatA, credentials })).toEqual(
    [],
  )
})
test('history invalid identity, chat, type and time reject the complete upstream snapshot', () => {
  for (const invalid of [
    { chatId: chatB },
    { chatType: PROVIDER.GROUP },
    { idMessage: EMPTY_STRING },
    { type: 'unknown' },
    { timestamp: -1 },
    { timestamp: 0.5 },
    { timestamp: Number.MAX_SAFE_INTEGER + 1 },
    { textMessage: null },
    { typeMessage: EMPTY_STRING },
  ])
    expect(
      normalizeHistory({
        value: [{ ...raw, ...invalid }],
        chatId: chatA,
        credentials,
      }),
    ).toBeNull()
  expect(normalizeHistory({ value: {}, chatId: chatA, credentials })).toBeNull()
})
test('history duplicate identifiers merge and optional unknown status does not invent delivery', () => {
  expect(
    normalizeHistory({
      value: [
        {
          ...raw,
          type: MESSAGE.OUTGOING,
          statusMessage: MESSAGE.READ,
        },
        {
          ...raw,
          type: MESSAGE.OUTGOING,
          statusMessage: MESSAGE.DELIVERED,
        },
      ],
      chatId: chatA,
      credentials,
    }),
  ).toEqual([
    {
      ...message,
      direction: MESSAGE.OUTGOING,
      status: MESSAGE.READ,
    },
  ])
  expect(
    normalizeHistory({
      value: [{ ...raw, statusMessage: MESSAGE.READ }],
      chatId: chatA,
      credentials,
    }),
  ).toEqual([message])
})
test('history handler binds session, scope and chat without leaking credentials', async () => {
  const { result, calls, clears } = await runHandler()
  expect(result.status).toBe(OK)
  expect(result.headers.get(CACHE_HEADER)).toBe(NO_STORE)
  expect(await result.json()).toEqual({
    status: SUCCESS,
    connectionScope: scopeA,
    chatId: chatA,
    messages: [message],
  })
  expect(calls).toBe(1)
  expect(clears).toBe(0)
})
for (const origin of INVALID_ORIGINS) {
  test(`history handler rejects Origin ${JSON.stringify(origin)} before body and provider`, async () => {
    const request = makeRequest({ origin })
    let bodyReads = 0
    request.json = async () => {
      bodyReads += 1
      return { chatId: chatA }
    }
    const { result, calls, clears } = await runHandler({ request })
    expect(result.status).toBe(FORBIDDEN)
    expect(await result.json()).toEqual({ status: ERROR, code: INVALID })
    expect([bodyReads, calls, clears]).toEqual([0, 0, 0])
  })
}
test('history handler rejects session, scope and body in the required order', async () => {
  const cases = [
    {
      context: { configured: false, credentials, connectionScope: scopeA },
      status: UNAVAILABLE,
      code: CODE.SERVER,
      clears: 0,
    },
    {
      context: { configured: true, credentials: null, connectionScope: null },
      status: UNAUTHORIZED,
      code: SESSION,
      clears: 1,
    },
    {
      request: makeRequest({ scope: 'bad' }),
      status: BAD_REQUEST,
      code: INVALID,
      clears: 0,
    },
    {
      request: makeRequest({ scope: scopeB }),
      status: CONFLICT,
      code: CHANGED,
      clears: 0,
    },
    {
      request: makeRequest({ body: { chatId: chatA, count: COUNT } }),
      status: BAD_REQUEST,
      code: INVALID,
      clears: 0,
    },
  ]
  for (const { status, code, clears: expectedClears, ...options } of cases) {
    const { result, calls, clears } = await runHandler(options)
    expect(result.status).toBe(status)
    expect(await result.json()).toEqual({ status: ERROR, code })
    expect(calls).toBe(0)
    expect(clears).toBe(expectedClears)
  }
})
test('history handler preserves session on target, upstream and transient failures', async () => {
  for (const [kind, status] of [
    [INVALID, BAD_REQUEST],
    [CODE.RATE_LIMITED, RATE_LIMITED],
    [UPSTREAM, BAD_GATEWAY],
    [CODE.UNAVAILABLE, UNAVAILABLE],
  ] as const) {
    const { result, clears } = await runHandler({
      lookup: async () => ({ kind }),
    })
    expect(result.status).toBe(status)
    expect(await result.json()).toEqual({ status: ERROR, code: kind })
    expect(clears).toBe(0)
  }
  const { result } = await runHandler({
    context: { configured: true, credentials: null, connectionScope: null },
    clearSession: async () => {
      throw new Error('fictional clear failure')
    },
  })
  expect(result.status).toBe(UNAVAILABLE)
})
test('history provider uses fixed POST count and bounded rate-limit retry', async () => {
  let calls = 0
  let waits = 0
  const result = await getChatHistory({
    credentials,
    chatId: chatA,
    fetcher: async (url, init) => {
      expect(String(url)).toContain(`/${PROVIDER_METHOD}/`)
      expect(init).toMatchObject({
        method: METHOD,
        cache: NO_STORE,
        redirect: HTTP.REDIRECT,
        headers: { [HTTP.CONTENT_TYPE]: CONTENT_TYPE },
      })
      expect(JSON.parse(String(init?.body))).toEqual({
        chatId: chatA,
        count: COUNT,
      })
      calls += 1
      return calls === 1
        ? Response.json({}, { status: RATE_LIMITED })
        : Response.json([raw])
    },
    waitForRetry: async ({ delay, signal }) => {
      expect(delay).toBe(HTTP.RETRY_DELAY_MS)
      expect(signal.aborted).toBe(false)
      waits += 1
    },
  })
  expect(result).toEqual({ kind: SUCCESS, messages: [message] })
  expect([calls, waits]).toEqual([2, 1])
})
test('history provider maps invalid target, response and two rate limits safely', async () => {
  for (const [status, body, expected] of [
    [BAD_REQUEST, 'Validation failed', INVALID],
    [OK, 'not json', UPSTREAM],
    [OK, JSON.stringify([{ ...raw, chatId: chatB }]), UPSTREAM],
    [UNAVAILABLE, RAW_SECRET, CODE.UNAVAILABLE],
  ] as const) {
    expect(
      await getChatHistory({
        credentials,
        chatId: chatA,
        fetcher: async () => new Response(body, { status }),
      }),
    ).toEqual({ kind: expected })
  }
  let calls = 0
  expect(
    await getChatHistory({
      credentials,
      chatId: chatA,
      fetcher: async () => {
        calls += 1
        return Response.json({}, { status: RATE_LIMITED })
      },
      waitForRetry: async () => undefined,
    }),
  ).toEqual({ kind: CODE.RATE_LIMITED })
  expect(calls).toBe(2)
})
test('history provider abort during retry or body never publishes a snapshot', async () => {
  const controller = new AbortController()
  let calls = 0
  const result = await getChatHistory({
    credentials,
    chatId: chatA,
    signal: controller.signal,
    fetcher: async () => {
      calls += 1
      return Response.json({}, { status: RATE_LIMITED })
    },
    waitForRetry: async () => {
      controller.abort()
    },
  })
  expect(result.kind).toBe(CODE.UNAVAILABLE)
  expect(calls).toBe(1)
  const bodyController = new AbortController()
  const response = Response.json([raw])
  response.text = async () => {
    bodyController.abort()
    return JSON.stringify([raw])
  }
  expect(
    await getChatHistory({
      credentials,
      chatId: chatA,
      signal: bodyController.signal,
      fetcher: async () => response,
    }),
  ).toEqual({ kind: CODE.UNAVAILABLE })
})
