import { expect, test } from '@playwright/test'
import { NextRequest } from 'next/server'
import { isSafeIdentifier } from '@/lib/green-api/safe-identifier'
import { sendMessage } from '@/lib/green-api/send-message'
import { handleSendRequest } from '@/lib/sending/handle-send-request'
import { readSendBody } from '@/lib/sending/read-send-body'
import type {
  ProviderSendResult,
  SendLeaseResult,
  SendRequestOptions,
} from '@/lib/sending/types'
import { validateSendRequest } from '@/lib/sending/validate-send-request'
import {
  HTTP_HEADERS,
  HTTP_METHOD,
  HTTP_CONTENT_TYPE,
} from '@/lib/http/constants'
import { EMPTY_STRING } from '@/lib/ui/constants'
import { HISTORY_TEST } from '../history/constants'
import {
  TEST_HTTP_PROTOCOL,
  TEST_API_CODE,
  TEST_NOTIFICATION_PROTOCOL,
} from '../protocol.constants'

const EXPECTED_PROVIDER_URL =
  'https://4100.api.green-api.com/waInstancefictional%2Fid/sendMessage/fictional%20token%2Fvalue'
const MESSAGE_REQUEST_URL = 'http://127.0.0.1:3101/api/messages'
const LOCAL_REQUEST_ORIGIN = 'http://127.0.0.1:3101'
const FOREIGN_ORIGIN = 'https://foreign.example.test'

const {
  POST: TEST_HTTP_PROTOCOL_POST,
  NO_STORE: TEST_HTTP_PROTOCOL_NO_STORE,
  JSON: TEST_HTTP_PROTOCOL_JSON,
} = TEST_HTTP_PROTOCOL
const {
  INSTANCE_EXPIRED: TEST_API_CODE_INSTANCE_EXPIRED,
  INVALID_TOKEN: TEST_API_CODE_INVALID_TOKEN,
  INVALID_INSTANCE: TEST_API_CODE_INVALID_INSTANCE,
  CONNECTION_CHANGED: TEST_API_CODE_CONNECTION_CHANGED,
  NEEDS_AUTHORIZATION: TEST_API_CODE_NEEDS_AUTHORIZATION,
  INSTANCE_RESTRICTED: TEST_API_CODE_INSTANCE_RESTRICTED,
} = TEST_API_CODE
const {
  NOT_OWNER: TEST_NOTIFICATION_PROTOCOL_NOT_OWNER,
  RECEIVER_NOT_ACTIVE: TEST_NOTIFICATION_PROTOCOL_RECEIVER_NOT_ACTIVE,
  SEND_IN_PROGRESS: TEST_NOTIFICATION_PROTOCOL_SEND_IN_PROGRESS,
} = TEST_NOTIFICATION_PROTOCOL

const { credentials, scopeA, scopeB, chatA, chatB } = HISTORY_TEST
const { CONNECTION_SCOPE, ORIGIN, HOST, CONTENT_TYPE, CACHE_CONTROL } =
  HTTP_HEADERS
const { POST } = HTTP_METHOD
const { JSON: JSON_CONTENT_TYPE } = HTTP_CONTENT_TYPE
// Repeated public expectations stay independent of implementation constants.
const SEND_EXPECTED = {
  HTTP: {
    OK: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    CONFLICT: 409,
    PAYLOAD_TOO_LARGE: 413,
    RATE_LIMIT: 429,
    BAD_GATEWAY: 502,
    UNAVAILABLE: 503,
  },
  OK: 'ok',
  ERROR: 'error',
  NOT_SENT: 'not_sent',
  UNKNOWN: 'unknown',
  INVALID_REQUEST: 'invalid_request',
  SESSION_REQUIRED: 'session_required',
  UPSTREAM_REJECTED: 'upstream_rejected',
  OUTCOME_UNKNOWN: 'outcome_unknown',
  RATE_LIMITED: 'rate_limited',
  SERVICE_UNAVAILABLE: 'service_unavailable',
  TOO_LARGE: 'too_large',
} as const
const {
  HTTP,
  OK: RESPONSE_OK,
  ERROR: RESPONSE_ERROR,
  NOT_SENT,
  UNKNOWN,
  INVALID_REQUEST,
  SESSION_REQUIRED,
  UPSTREAM_REJECTED,
  OUTCOME_UNKNOWN,
  RATE_LIMITED,
  SERVICE_UNAVAILABLE,
  TOO_LARGE,
} = SEND_EXPECTED
const {
  OK,
  BAD_REQUEST,
  UNAUTHORIZED,
  FORBIDDEN,
  CONFLICT,
  PAYLOAD_TOO_LARGE,
  RATE_LIMIT,
  BAD_GATEWAY,
  UNAVAILABLE,
} = HTTP
// Independent public expectations; deliberately not imported from sending constants.
const SEND_TEST = {
  API: 'https://app.example.test/api/messages',
  ORIGIN: 'https://app.example.test',
  ATTEMPT: '12345678-1234-4234-8234-123456789abc',
  OWNER: 'fictional-owner-capability',
  ID: 'fictional-accepted-message',
  TEXT: '  Первая строка\nВторая строка 😃  ',
  EMOJI: '😃',
  MAX_POINTS: 4096,
  MAX_BYTES: 65_536,
  TIMEOUT_MS: 10_000,
  NO_STORE: 'no-store',
  ERROR: 'fictional provider or cleanup error',
  VALIDATION:
    "Validation failed. Details: 'message' length must be less than or equal to 4096 characters long",
  EXPIRED:
    'Instance account is expired. Renew your instance from personal area',
  INVALID_ORIGINS: [
    null,
    'null',
    'invalid',
    'https://foreign.example.test',
    'https://app.example.test/path',
    'https://app.example.test?q=1',
    'https://app.example.test#fragment',
    'ftp://app.example.test',
    'https://user:password@app.example.test',
  ],
  INVALID_HOSTS: [
    'app.example.test/path',
    'user@app.example.test',
    'app.example.test#fragment',
    'app.example.test?query',
    'app.example.test\\path',
  ],
} as const
const {
  API,
  ORIGIN: APP_ORIGIN,
  ATTEMPT,
  OWNER,
  ID,
  TEXT,
  EMOJI,
  MAX_POINTS,
  MAX_BYTES,
  TIMEOUT_MS,
  NO_STORE,
  ERROR,
  VALIDATION,
  EXPIRED,
  INVALID_ORIGINS,
  INVALID_HOSTS,
} = SEND_TEST
const input = { chatId: chatA, message: TEXT, attemptId: ATTEMPT }
const accepted: ProviderSendResult = { kind: RESPONSE_OK, idMessage: ID }
const makeRequest = (
  options: {
    value?: unknown
    raw?: string
    origin?: string | null
    scope?: string | null
    mediaType?: string | null
    signal?: AbortSignal
    host?: string
  } = {},
) => {
  const {
    value = input,
    raw,
    origin = APP_ORIGIN,
    scope = scopeA,
    mediaType = JSON_CONTENT_TYPE,
    signal,
    host,
  } = options
  const headers = new Headers()
  if (origin !== null) headers.set(ORIGIN, origin)
  if (scope !== null) headers.set(CONNECTION_SCOPE, scope)
  if (mediaType !== null) headers.set(CONTENT_TYPE, mediaType)
  if (host !== undefined) headers.set(HOST, host)
  return new Request(API, {
    method: POST,
    headers,
    body: raw ?? JSON.stringify(value),
    signal,
  })
}
const createHarness = (options: Partial<SendRequestOptions> = {}) => {
  const effects = { sends: 0, leases: 0, releases: 0, clears: 0 }
  const requestOptions: SendRequestOptions = {
    request: makeRequest(),
    context: {
      configured: true,
      credentials,
      connectionScope: scopeA,
      ownerCapability: OWNER,
    },
    send: async () => {
      effects.sends += 1
      return accepted
    },
    clearSession: async () => {
      effects.clears += 1
    },
    tryAcquireSend: () => {
      effects.leases += 1
      return {
        kind: RESPONSE_OK,
        release: () => {
          effects.releases += 1
        },
      }
    },
    ...options,
  }
  return {
    effects,
    requestOptions,
    run: () => handleSendRequest(requestOptions),
  }
}
const expectFailure = async ({
  response,
  status,
  code,
  outcome = NOT_SENT,
}: {
  response: Response
  status: number
  code: string
  outcome?: string
}) => {
  expect(response.status).toBe(status)
  expect(response.headers.get(CACHE_CONTROL)).toBe(NO_STORE)
  expect(await response.json()).toEqual({
    status: RESPONSE_ERROR,
    code,
    outcome,
  })
}
const deferred = <T>() => {
  let settled = false
  let resolve!: (value: T) => void
  const promise = new Promise<T>((accept) => {
    resolve = (value) => {
      settled = true
      accept(value)
    }
  })
  return { promise, resolve, isSettled: () => settled }
}

test('send validation keeps original text and opaque personal chat identifiers', () => {
  expect(validateSendRequest({ value: input, credentials })).toEqual(input)
  const boundary = { ...input, message: EMOJI.repeat(MAX_POINTS) }
  expect(validateSendRequest({ value: boundary, credentials })).toEqual(
    boundary,
  )
})
test('send validation rejects missing/extra fields, whitespace, groups, aliases and invalid UUIDs', () => {
  const invalid = [
    null,
    [],
    {},
    { ...input, extra: true },
    { ...input, attemptId: EMPTY_STRING },
    { ...input, attemptId: 'invalid-uuid' },
    { ...input, attemptId: `${ATTEMPT}\n` },
    { ...input, message: EMPTY_STRING },
    { ...input, message: ' \n\t ' },
    { ...input, message: 1 },
    { ...input, message: EMOJI.repeat(MAX_POINTS + 1) },
    { ...input, chatId: '-1' },
    { ...input, chatId: '1@c.us' },
    { ...input, chatId: '1@g.us' },
    { ...input, chatId: ' chat ' },
    { ...input, chatId: 'bad\nchat' },
    { ...input, chatId: `${chatA}-${credentials.apiTokenInstance}` },
  ]
  for (const value of invalid)
    expect(validateSendRequest({ value, credentials })).toBeNull()
})
test('safe identifier permits opaque IDs but never raw or encoded credentials', () => {
  const secrets = ['fictional secret/token', credentials.idInstance]
  expect(isSafeIdentifier({ value: ID, secrets })).toBe(true)
  const invalid = [
    null,
    1,
    EMPTY_STRING,
    ` ${ID}`,
    `${ID}\n`,
    `prefix-${secrets[0]}`,
    `prefix-${encodeURIComponent(secrets[0])}`,
    secrets[1],
  ]
  for (const value of invalid)
    expect(isSafeIdentifier({ value, secrets })).toBe(false)
})
test('send body supports JSON parameters and escaped 4096 Unicode points', async () => {
  const raw = JSON.stringify({
    ...input,
    message: EMOJI.repeat(MAX_POINTS),
  }).replaceAll(EMOJI, '\\ud83d\\ude03')
  expect(new TextEncoder().encode(raw).length).toBeLessThan(MAX_BYTES)
  expect(
    await readSendBody(
      makeRequest({ raw, mediaType: `${JSON_CONTENT_TYPE}; charset=utf-8` }),
    ),
  ).toEqual({
    kind: RESPONSE_OK,
    value: { ...input, message: EMOJI.repeat(MAX_POINTS) },
  })
})
test('send body counts actual UTF-8 bytes and stops oversized streams despite a false Content-Length', async () => {
  let cancellations = 0
  const stream = new ReadableStream<Uint8Array>({
    start: (controller) => {
      controller.enqueue(
        new TextEncoder().encode(EMOJI.repeat(MAX_BYTES / 4 + 1)),
      )
    },
    cancel: () => {
      cancellations += 1
    },
  })
  const request = makeRequest()
  request.headers.set('Content-Length', '1')
  Object.defineProperty(request, 'body', { value: stream })
  expect(await readSendBody(request)).toEqual({ kind: TOO_LARGE })
  expect(cancellations).toBe(1)
})
test('send body accepts the exact byte boundary, rejects malformed JSON and invalid UTF-8', async () => {
  const raw = `${JSON.stringify(input)}${' '.repeat(MAX_BYTES - new TextEncoder().encode(JSON.stringify(input)).length)}`
  expect(await readSendBody(makeRequest({ raw }))).toEqual({
    kind: RESPONSE_OK,
    value: input,
  })
  for (const rawBody of ['{', EMPTY_STRING])
    expect(await readSendBody(makeRequest({ raw: rawBody }))).toEqual({
      kind: INVALID_REQUEST,
    })
  const request = makeRequest()
  Object.defineProperty(request, 'body', {
    value: new ReadableStream({
      start: (controller) => {
        controller.enqueue(Uint8Array.of(0xff))
        controller.close()
      },
    }),
  })
  expect(await readSendBody(request)).toEqual({ kind: INVALID_REQUEST })
})
for (const mediaType of [null, 'text/plain', 'application/jsonp']) {
  test(`send body rejects media type ${mediaType}`, async () => {
    expect(await readSendBody(makeRequest({ mediaType }))).toEqual({
      kind: INVALID_REQUEST,
    })
  })
}
test('provider dispatches one POST with original text, encoded credentials, deadline and no retry', async () => {
  const privateCredentials = {
    idInstance: 'fictional/id',
    apiTokenInstance: 'fictional token/value',
  }
  const calls: { url: string; init: RequestInit | undefined }[] = []
  const result = await sendMessage({
    credentials: privateCredentials,
    chatId: chatA,
    message: TEXT,
    fetcher: async (url, init) => {
      calls.push({ url: String(url), init })
      return Response.json({
        idMessage: ID,
        timestamp: 100,
        delivered: true,
        secret: privateCredentials.apiTokenInstance,
      })
    },
  })
  expect(result).toEqual(accepted)
  expect(calls).toHaveLength(1)
  expect(calls[0].url).toBe(EXPECTED_PROVIDER_URL)
  expect(calls[0].init).toMatchObject({
    method: TEST_HTTP_PROTOCOL_POST,
    cache: TEST_HTTP_PROTOCOL_NO_STORE,
    redirect: RESPONSE_ERROR,
    headers: { 'Content-Type': TEST_HTTP_PROTOCOL_JSON },
  })
  expect(JSON.parse(String(calls[0].init?.body))).toEqual({
    chatId: chatA,
    message: TEXT,
  })
  expect(calls[0].init?.signal).toBeInstanceOf(AbortSignal)
})
const providerCases: {
  label: string
  status: number
  body: string
  kind: ProviderSendResult['kind']
}[] = [
  {
    label: 'validation',
    status: BAD_REQUEST,
    body: VALIDATION,
    kind: UPSTREAM_REJECTED,
  },
  {
    label: 'expired',
    status: BAD_REQUEST,
    body: EXPIRED,
    kind: TEST_API_CODE_INSTANCE_EXPIRED,
  },
  {
    label: 'unknown 400',
    status: BAD_REQUEST,
    body: ERROR,
    kind: OUTCOME_UNKNOWN,
  },
  {
    label: 'invalid token',
    status: UNAUTHORIZED,
    body: ERROR,
    kind: TEST_API_CODE_INVALID_TOKEN,
  },
  {
    label: 'invalid instance',
    status: FORBIDDEN,
    body: ERROR,
    kind: TEST_API_CODE_INVALID_INSTANCE,
  },
  { label: 'rate limit', status: RATE_LIMIT, body: ERROR, kind: RATE_LIMITED },
  {
    label: 'server failure',
    status: 500,
    body: ERROR,
    kind: OUTCOME_UNKNOWN,
  },
  { label: 'redirect', status: 302, body: ERROR, kind: OUTCOME_UNKNOWN },
  { label: 'missing ID', status: OK, body: '{}', kind: OUTCOME_UNKNOWN },
  {
    label: 'numeric ID',
    status: OK,
    body: '{"idMessage":1}',
    kind: OUTCOME_UNKNOWN,
  },
  {
    label: 'malformed accepted',
    status: OK,
    body: '{',
    kind: OUTCOME_UNKNOWN,
  },
]
for (const scenario of providerCases) {
  test(`provider ${scenario.label} yields ${scenario.kind} without retry or raw payload`, async () => {
    let calls = 0
    const result = await sendMessage({
      credentials,
      chatId: chatA,
      message: TEXT,
      fetcher: async () => {
        calls += 1
        return new Response(scenario.body, { status: scenario.status })
      },
    })
    expect(result).toEqual({ kind: scenario.kind })
    expect(calls).toBe(1)
  })
}
test('provider rejects raw and encoded secrets in accepted IDs without changing user-authored text', async () => {
  const privateCredentials = {
    idInstance: 'fictional/private-id',
    apiTokenInstance: 'fictional private/token',
  }
  for (const secret of Object.values(privateCredentials)) {
    for (const idMessage of [secret, encodeURIComponent(secret)]) {
      let sentBody: unknown
      const result = await sendMessage({
        credentials: privateCredentials,
        chatId: chatA,
        message: privateCredentials.apiTokenInstance,
        fetcher: async (_url, init) => {
          sentBody = JSON.parse(String(init?.body))
          return Response.json({ idMessage })
        },
      })
      expect(result).toEqual({ kind: OUTCOME_UNKNOWN })
      expect(sentBody).toEqual({
        chatId: chatA,
        message: privateCredentials.apiTokenInstance,
      })
    }
  }
})
test('provider network failure is unknown and never retried', async () => {
  let calls = 0
  const result = await sendMessage({
    credentials,
    chatId: chatA,
    message: TEXT,
    fetcher: async () => {
      calls += 1
      throw new Error(ERROR)
    },
  })
  expect(result).toEqual({ kind: OUTCOME_UNKNOWN })
  expect(calls).toBe(1)
})
test('provider uses a 10 second deadline, classifies timeout as unknown, and never retries', async () => {
  const originalTimeout = AbortSignal.timeout
  const deadline = new AbortController()
  const delays: number[] = []
  let calls = 0
  AbortSignal.timeout = (delay) => {
    delays.push(delay)
    return deadline.signal
  }
  try {
    const result = await sendMessage({
      credentials,
      chatId: chatA,
      message: TEXT,
      fetcher: async (_url, init) => {
        calls += 1
        deadline.abort(new Error(ERROR))
        init?.signal?.throwIfAborted()
        return Response.json({ idMessage: ID })
      },
    })
    expect(result).toEqual({ kind: OUTCOME_UNKNOWN })
    expect(delays).toEqual([TIMEOUT_MS])
    expect(calls).toBe(1)
  } finally {
    AbortSignal.timeout = originalTimeout
  }
})
test('handler binds accepted DTO to original scope, chat and attempt without fake timestamp/status', async () => {
  const harness = createHarness()
  const response = await harness.run()
  expect(response.status).toBe(OK)
  expect(response.headers.get(CACHE_CONTROL)).toBe(NO_STORE)
  expect(await response.json()).toEqual({
    status: RESPONSE_OK,
    connectionScope: scopeA,
    chatId: chatA,
    attemptId: ATTEMPT,
    idMessage: ID,
  })
  expect(harness.effects).toEqual({
    sends: 1,
    leases: 1,
    releases: 1,
    clears: 0,
  })
})
for (const origin of INVALID_ORIGINS) {
  test(`handler rejects Origin ${JSON.stringify(origin)} before reading body, acquiring lease or clearing session`, async () => {
    const request = makeRequest({ origin })
    const originalBody = request.body
    let reads = 0
    Object.defineProperty(request, 'body', {
      get: () => {
        reads += 1
        return originalBody
      },
    })
    const harness = createHarness({
      request,
      context: {
        configured: false,
        credentials: null,
        connectionScope: null,
        ownerCapability: null,
      },
    })
    await expectFailure({
      response: await harness.run(),
      status: FORBIDDEN,
      code: INVALID_REQUEST,
    })
    expect(reads).toBe(0)
    expect(harness.effects).toEqual({
      sends: 0,
      leases: 0,
      releases: 0,
      clears: 0,
    })
  })
}
test('handler uses actual loopback Host when Next normalizes the request URL', async () => {
  const request = new NextRequest(MESSAGE_REQUEST_URL, {
    method: POST,
    headers: {
      [ORIGIN]: LOCAL_REQUEST_ORIGIN,
      [HOST]: '127.0.0.1:3101',
      [CONNECTION_SCOPE]: scopeA,
      [CONTENT_TYPE]: JSON_CONTENT_TYPE,
    },
    body: JSON.stringify(input),
  })
  const harness = createHarness({ request })
  expect((await harness.run()).status).toBe(OK)
  expect(harness.effects.sends).toBe(1)
})
for (const host of INVALID_HOSTS) {
  test(`handler rejects malformed Host ${host}`, async () => {
    const harness = createHarness({ request: makeRequest({ host }) })
    await expectFailure({
      response: await harness.run(),
      status: FORBIDDEN,
      code: INVALID_REQUEST,
    })
    expect(harness.effects.sends).toBe(0)
  })
}
test('handler ignores arbitrary forwarded headers for Origin', async () => {
  const request = makeRequest({ origin: FOREIGN_ORIGIN })
  request.headers.set('X-Forwarded-Host', 'foreign.example.test')
  request.headers.set('X-Forwarded-Proto', 'https')
  const harness = createHarness({ request })
  await expectFailure({
    response: await harness.run(),
    status: FORBIDDEN,
    code: INVALID_REQUEST,
  })
  expect(harness.effects.sends).toBe(0)
})
const guardCases: {
  label: string
  options: Partial<SendRequestOptions>
  status: number
  code: string
  clears: number
}[] = [
  {
    label: 'unconfigured',
    options: {
      context: {
        configured: false,
        credentials,
        connectionScope: scopeA,
        ownerCapability: OWNER,
      },
    },
    status: UNAVAILABLE,
    code: 'server_unavailable',
    clears: 0,
  },
  {
    label: 'no session',
    options: {
      context: {
        configured: true,
        credentials: null,
        connectionScope: null,
        ownerCapability: OWNER,
      },
    },
    status: UNAUTHORIZED,
    code: SESSION_REQUIRED,
    clears: 1,
  },
  {
    label: 'missing scope',
    options: { request: makeRequest({ scope: null }) },
    status: BAD_REQUEST,
    code: INVALID_REQUEST,
    clears: 0,
  },
  {
    label: 'invalid scope',
    options: { request: makeRequest({ scope: EMPTY_STRING }) },
    status: BAD_REQUEST,
    code: INVALID_REQUEST,
    clears: 0,
  },
  {
    label: 'foreign scope',
    options: { request: makeRequest({ scope: scopeB }) },
    status: CONFLICT,
    code: TEST_API_CODE_CONNECTION_CHANGED,
    clears: 0,
  },
  {
    label: 'invalid input',
    options: { request: makeRequest({ value: { ...input, message: ' \n ' } }) },
    status: BAD_REQUEST,
    code: INVALID_REQUEST,
    clears: 0,
  },
  {
    label: 'secret target',
    options: {
      request: makeRequest({
        value: { ...input, chatId: credentials.idInstance },
      }),
    },
    status: BAD_REQUEST,
    code: INVALID_REQUEST,
    clears: 0,
  },
  {
    label: 'body limit',
    options: { request: makeRequest({ raw: ' '.repeat(MAX_BYTES + 1) }) },
    status: PAYLOAD_TOO_LARGE,
    code: INVALID_REQUEST,
    clears: 0,
  },
]
for (const scenario of guardCases) {
  test(`handler ${scenario.label} prevents lease and provider effects`, async () => {
    const harness = createHarness(scenario.options)
    await expectFailure({
      response: await harness.run(),
      status: scenario.status,
      code: scenario.code,
    })
    expect(harness.effects).toEqual({
      sends: 0,
      leases: 0,
      releases: 0,
      clears: scenario.clears,
    })
  })
}
const deniedLeases: SendLeaseResult[] = [
  { kind: TEST_NOTIFICATION_PROTOCOL_NOT_OWNER },
  { kind: TEST_NOTIFICATION_PROTOCOL_RECEIVER_NOT_ACTIVE },
  { kind: TEST_NOTIFICATION_PROTOCOL_SEND_IN_PROGRESS },
]
for (const lease of deniedLeases) {
  test(`handler ${lease.kind} never sends or clears cookie`, async () => {
    const harness = createHarness({ tryAcquireSend: () => lease })
    await expectFailure({
      response: await harness.run(),
      status: CONFLICT,
      code: lease.kind,
    })
    expect(harness.effects.sends).toBe(0)
    expect(harness.effects.clears).toBe(0)
  })
}
test('handler passes captured identity and owner capability to the shared lease dependency', async () => {
  const leaseCalls: unknown[] = []
  const harness = createHarness({
    tryAcquireSend: (options) => {
      leaseCalls.push(options)
      return { kind: RESPONSE_OK, release: () => undefined }
    },
  })
  expect((await harness.run()).status).toBe(OK)
  expect(leaseCalls).toEqual([
    {
      credentials,
      connectionScope: scopeA,
      ownerCapability: OWNER,
      attemptId: ATTEMPT,
    },
  ])
})
test('handler rejects a cancelled request before dispatch and releases the acquired lease', async () => {
  const controller = new AbortController()
  controller.abort()
  const harness = createHarness({
    request: makeRequest({ signal: controller.signal }),
  })
  await expectFailure({
    response: await harness.run(),
    status: UNAVAILABLE,
    code: SERVICE_UNAVAILABLE,
  })
  expect(harness.effects.sends).toBe(0)
  expect(harness.effects.releases).toBe(harness.effects.leases)
})
test('disconnect does not release a dispatched send or move the late result to another chat', async () => {
  const controller = new AbortController()
  const result = deferred<ProviderSendResult>()
  const started = deferred<boolean>()
  const harness = createHarness({
    request: makeRequest({ signal: controller.signal }),
    send: async (options) => {
      expect(options.signal).not.toBe(controller.signal)
      expect(options.chatId).toBe(chatA)
      started.resolve(true)
      return result.promise
    },
  })
  const responsePromise = harness.run()
  await expect.poll(started.isSettled, { timeout: 1000 }).toBe(true)
  await started.promise
  controller.abort()
  harness.requestOptions.context.connectionScope = scopeB
  expect(harness.effects.releases).toBe(0)
  result.resolve(accepted)
  const response = await responsePromise
  expect(response.status).toBe(OK)
  expect(await response.json()).toEqual({
    status: RESPONSE_OK,
    connectionScope: scopeA,
    chatId: chatA,
    attemptId: ATTEMPT,
    idMessage: ID,
  })
  expect(harness.effects.releases).toBe(1)
})
test('second send is rejected until the first upstream settles', async () => {
  const gate = deferred<ProviderSendResult>()
  const started = deferred<boolean>()
  let pending = false
  let sends = 0
  const tryAcquireSend = (): SendLeaseResult => {
    if (pending) return { kind: TEST_NOTIFICATION_PROTOCOL_SEND_IN_PROGRESS }
    pending = true
    return {
      kind: RESPONSE_OK,
      release: () => {
        pending = false
      },
    }
  }
  const send = async () => {
    sends += 1
    started.resolve(true)
    return gate.promise
  }
  const first = createHarness({ tryAcquireSend, send }).run()
  await expect.poll(started.isSettled, { timeout: 1000 }).toBe(true)
  await started.promise
  const second = await createHarness({
    request: makeRequest({ value: { ...input, chatId: chatB } }),
    tryAcquireSend,
    send,
  }).run()
  await expectFailure({
    response: second,
    status: CONFLICT,
    code: TEST_NOTIFICATION_PROTOCOL_SEND_IN_PROGRESS,
  })
  expect(sends).toBe(1)
  gate.resolve(accepted)
  expect((await first).status).toBe(OK)
  expect(pending).toBe(false)
})
const resultCases: {
  kind: Exclude<ProviderSendResult, { kind: typeof RESPONSE_OK }>['kind']
  status: number
  code: string
  outcome: string
  clears: number
}[] = [
  {
    kind: TEST_API_CODE_INVALID_TOKEN,
    status: UNAUTHORIZED,
    code: SESSION_REQUIRED,
    outcome: NOT_SENT,
    clears: 1,
  },
  {
    kind: TEST_API_CODE_INVALID_INSTANCE,
    status: UNAUTHORIZED,
    code: SESSION_REQUIRED,
    outcome: NOT_SENT,
    clears: 1,
  },
  {
    kind: TEST_API_CODE_INSTANCE_EXPIRED,
    status: UNAUTHORIZED,
    code: SESSION_REQUIRED,
    outcome: NOT_SENT,
    clears: 1,
  },
  {
    kind: TEST_API_CODE_NEEDS_AUTHORIZATION,
    status: UNAUTHORIZED,
    code: SESSION_REQUIRED,
    outcome: NOT_SENT,
    clears: 1,
  },
  {
    kind: TEST_API_CODE_INSTANCE_RESTRICTED,
    status: UNAUTHORIZED,
    code: SESSION_REQUIRED,
    outcome: NOT_SENT,
    clears: 1,
  },
  {
    kind: UPSTREAM_REJECTED,
    status: BAD_REQUEST,
    code: UPSTREAM_REJECTED,
    outcome: NOT_SENT,
    clears: 0,
  },
  {
    kind: RATE_LIMITED,
    status: RATE_LIMIT,
    code: RATE_LIMITED,
    outcome: NOT_SENT,
    clears: 0,
  },
  {
    kind: OUTCOME_UNKNOWN,
    status: BAD_GATEWAY,
    code: OUTCOME_UNKNOWN,
    outcome: UNKNOWN,
    clears: 0,
  },
]
for (const scenario of resultCases) {
  test(`handler maps ${scenario.kind} without retry and releases once`, async () => {
    const harness = createHarness()
    harness.requestOptions.send = async () => {
      harness.effects.sends += 1
      return { kind: scenario.kind }
    }
    await expectFailure({ response: await harness.run(), ...scenario })
    expect(harness.effects).toEqual({
      sends: 1,
      leases: 1,
      releases: 1,
      clears: scenario.clears,
    })
  })
}
test('throwing lease is not_sent; throwing dispatched provider is unknown; both hide diagnostic data', async () => {
  const before = createHarness({
    tryAcquireSend: () => {
      throw new Error(credentials.apiTokenInstance)
    },
  })
  await expectFailure({
    response: await before.run(),
    status: UNAVAILABLE,
    code: SERVICE_UNAVAILABLE,
  })
  expect(before.effects.sends).toBe(0)
  const after = createHarness({
    send: async () => {
      throw new Error(credentials.apiTokenInstance)
    },
  })
  await expectFailure({
    response: await after.run(),
    status: BAD_GATEWAY,
    code: OUTCOME_UNKNOWN,
    outcome: UNKNOWN,
  })
  expect(after.effects.releases).toBe(1)
})
test('release failure never loses a known accepted message or downgrades an unknown outcome', async () => {
  const tryAcquireSend = (): SendLeaseResult => ({
    kind: RESPONSE_OK,
    release: () => {
      throw new Error(ERROR)
    },
  })
  const harness = createHarness({ tryAcquireSend })
  const response = await harness.run()
  expect(response.status).toBe(OK)
  expect(await response.json()).toMatchObject({
    idMessage: ID,
    status: RESPONSE_OK,
  })
  const unknown = createHarness({
    tryAcquireSend,
    send: async () => ({ kind: OUTCOME_UNKNOWN }),
  })
  await expectFailure({
    response: await unknown.run(),
    status: BAD_GATEWAY,
    code: OUTCOME_UNKNOWN,
    outcome: UNKNOWN,
  })
})
test('cookie cleanup failure after a confirmed refusal retains not_sent certainty', async () => {
  const harness = createHarness({
    send: async () => ({ kind: TEST_API_CODE_INVALID_TOKEN }),
    clearSession: async () => {
      throw new Error(ERROR)
    },
  })
  await expectFailure({
    response: await harness.run(),
    status: UNAVAILABLE,
    code: SERVICE_UNAVAILABLE,
  })
  expect(harness.effects.releases).toBe(1)
})
