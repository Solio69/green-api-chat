import { expect, test } from '@playwright/test'
import { createAckProof, verifyAckProof } from '@/lib/notifications/ack-proof'
import { handleNotificationRequest } from '@/lib/notifications/handle-notification-request'
import type { NotificationRequestOptions } from '@/lib/notifications/handle-notification-request'
import { ReceiverError } from '@/lib/notifications/receiver-error'
import type {
  ReceiverContext,
  ReceiverProvider,
} from '@/lib/notifications/types'
import { HISTORY_TEST } from '../history/constants'
import { envelope, NOTIFICATION_TEST } from '../notifications/constants'
import {
  TEST_HTTP_PROTOCOL,
  TEST_API_RESPONSE,
  TEST_API_CODE,
} from '../protocol.constants'

const POLLING_TEST = {
  ORIGIN: 'https://polling.example.test',
  FOREIGN: 'https://foreign.example.test',
  RECEIVE: 'receive',
  SETTINGS: 'settings',
  ACK: 'ack',
  EPOCH: 'polling-browser-epoch',
  PASSWORD: 'fictional-polling-password-with-more-than-32-characters',
  OTHER_PASSWORD: 'different-fictional-password-more-than-32-characters',
  TTL_MS: 600_000,
  PROOF_TTL_MS: 300_000,
  NOW: 100_000,
  DELETED: 'delivery_changed',
  HEADER_SCOPE: 'X-Connection-Scope',
  HEADER_RETRY: 'Retry-After',
  HEADER_LENGTH: 'Content-Length',
  INVALID: 'invalid',
  INVALID_REQUEST: 'invalid_request',
  MAX_BYTES: 8_192,
  OK: 200,
  INVALID_STATUS: 400,
  DENIED: 403,
  NO_AUTH: 401,
  CHANGED: 409,
  WRONG_METHOD: 405,
  UNAVAILABLE: 503,
  UPSTREAM: 502,
  NO_STORE: 'no-store',
  CACHE_HEADER: 'Cache-Control',
} as const
const {
  ORIGIN,
  FOREIGN,
  RECEIVE,
  SETTINGS,
  ACK,
  EPOCH,
  PASSWORD,
  OTHER_PASSWORD,
  TTL_MS,
  PROOF_TTL_MS,
  NOW,
  DELETED,
  HEADER_SCOPE,
  HEADER_RETRY,
  HEADER_LENGTH,
  INVALID,
  INVALID_REQUEST,
  MAX_BYTES,
  OK,
  INVALID_STATUS,
  DENIED,
  NO_AUTH,
  CHANGED,
  WRONG_METHOD,
  UNAVAILABLE,
  UPSTREAM,
  NO_STORE,
  CACHE_HEADER,
} = POLLING_TEST
const {
  POST,
  GET,
  JSON: JSON_TYPE,
  CONTENT_TYPE,
  ORIGIN: ORIGIN_HEADER,
} = TEST_HTTP_PROTOCOL
const { OK: RESPONSE_OK } = TEST_API_RESPONSE
const { SESSION_REQUIRED, RETRY_LATER, INVALID_UPSTREAM_RESPONSE } =
  TEST_API_CODE
const { CREDENTIALS, RECEIPT, MESSAGE } = NOTIFICATION_TEST
const { scopeA, scopeB } = HISTORY_TEST
const createContext = (): ReceiverContext => ({
  credentials: CREDENTIALS,
  connectionScope: scopeA,
  expiresAt: Date.now() + TTL_MS,
})
type RequestInput = {
  action?: NotificationRequestOptions['action']
  body?: unknown
  origin?: string | null
  scope?: string | null
  method?: string
  signal?: AbortSignal
  raw?: string
  headers?: Record<string, string>
}
const makeRequest = ({
  action = RECEIVE,
  body = { ownerEpoch: EPOCH },
  origin = ORIGIN,
  scope = scopeA,
  method = POST,
  signal,
  raw,
  headers: extra,
}: RequestInput = {}) => {
  const headers = new Headers({ [CONTENT_TYPE]: JSON_TYPE, ...extra })
  if (origin !== null) headers.set(ORIGIN_HEADER, origin)
  if (scope !== null) headers.set(HEADER_SCOPE, scope)
  return new Request(`${ORIGIN}/api/notifications/${action}`, {
    method,
    headers,
    signal,
    body: method === POST ? (raw ?? JSON.stringify(body)) : undefined,
  })
}
const createHarness = ({
  context = createContext(),
  configured = true,
  password = PASSWORD,
  provider: overrides = {},
}: {
  context?: ReceiverContext | null
  configured?: boolean
  password?: string
  provider?: Partial<ReceiverProvider>
} = {}) => {
  const effects = { reads: 0, deletes: [] as number[], clears: 0, settings: 0 }
  const provider: ReceiverProvider = {
    settings: async () => {
      effects.settings += 1
      return { outgoingEnabled: true }
    },
    receive: async () => {
      effects.reads += 1
      return envelope()
    },
    delete: async ({ receiptId }) => {
      effects.deletes.push(receiptId)
      return true
    },
    ...overrides,
  }
  const run = (input: RequestInput = {}) =>
    handleNotificationRequest({
      request: makeRequest(input),
      action: input.action ?? RECEIVE,
      context,
      configured,
      password,
      provider,
      clearSession: async () => {
        effects.clears += 1
      },
    })
  return { effects, run, context, provider }
}
test('receive returns a notification without registering a process-local owner', async () => {
  const harness = createHarness()
  const response = await harness.run()
  expect(response.status).toBe(OK)
  expect(response.headers.get(CACHE_HEADER)).toBe(NO_STORE)
  const value = await response.json()
  expect(value.delivery.event.message.idMessage).toBe(MESSAGE)
  expect(value.delivery.ownerEpoch).toBe(EPOCH)
  expect(value.delivery.deliveryId).toBe(value.ackToken)
  expect(value.ackToken).not.toContain(CREDENTIALS.apiTokenInstance)
  expect(harness.effects.deletes).toEqual([])
})
test('receive on A and ACK on a fresh B delete only the signed receipt', async () => {
  const context = createContext()
  const a = createHarness({ context })
  const value = await (await a.run()).json()
  const b = createHarness({ context })
  const response = await b.run({
    action: ACK,
    body: { ackToken: value.ackToken },
  })
  expect(response.status).toBe(OK)
  expect(await response.json()).toEqual({
    status: RESPONSE_OK,
    connectionScope: scopeA,
    deliveryId: value.ackToken,
  })
  expect(a.effects.deletes).toEqual([])
  expect(b.effects.reads).toBe(0)
  expect(b.effects.deletes).toEqual([RECEIPT])
})
test('empty receive returns bounded JSON and never ACKs/deletes', async () => {
  const harness = createHarness({ provider: { receive: async () => null } })
  const response = await harness.run()
  expect(await response.json()).toEqual({
    status: RESPONSE_OK,
    connectionScope: scopeA,
    delivery: null,
    ackToken: null,
  })
  expect(harness.effects.deletes).toEqual([])
})
test('settings keeps disabled outgoing status distinguishable without an owner registry', async () => {
  const harness = createHarness({
    provider: { settings: async () => ({ outgoingEnabled: false }) },
  })
  const response = await harness.run({ action: SETTINGS, body: {} })
  expect(response.status).toBe(OK)
  expect(await response.json()).toMatchObject({ outgoingEnabled: false })
  expect(harness.effects.reads).toBe(0)
})
test('signed ACK rejects tamper, different secret, changed scope, malformed and exact expiry', () => {
  const context = { ...createContext(), expiresAt: NOW + TTL_MS }
  const token = createAckProof({
    context,
    receiptId: RECEIPT,
    password: PASSWORD,
    now: NOW,
  })
  expect(verifyAckProof({ token, context, password: PASSWORD, now: NOW })).toBe(
    RECEIPT,
  )
  expect(
    verifyAckProof({ token, context, password: OTHER_PASSWORD, now: NOW }),
  ).toBeNull()
  expect(
    verifyAckProof({
      token,
      context: { ...context, connectionScope: scopeB },
      password: PASSWORD,
      now: NOW,
    }),
  ).toBeNull()
  expect(
    verifyAckProof({
      token,
      context,
      password: PASSWORD,
      now: NOW + PROOF_TTL_MS,
    }),
  ).toBeNull()
  for (const invalid of [
    INVALID,
    token + INVALID,
    token.slice(1),
    token.replace(scopeA, scopeB),
  ]) {
    if (invalid === token) continue
    expect(
      verifyAckProof({ token: invalid, context, password: PASSWORD, now: NOW }),
    ).toBeNull()
  }
})
test('ACK expiry never exceeds cookie expiry', () => {
  const context = { ...createContext(), expiresAt: NOW + 1_000 }
  const token = createAckProof({
    context,
    receiptId: RECEIPT,
    password: PASSWORD,
    now: NOW,
  })
  expect(
    verifyAckProof({
      token,
      context,
      password: PASSWORD,
      now: context.expiresAt - 1,
    }),
  ).toBe(RECEIPT)
  expect(
    verifyAckProof({
      token,
      context,
      password: PASSWORD,
      now: context.expiresAt,
    }),
  ).toBeNull()
})
test('forged, expired and foreign ACK never delete', async () => {
  const harness = createHarness()
  const context = harness.context!
  const tokens = [
    INVALID,
    createAckProof({
      context: { ...context, connectionScope: scopeB },
      receiptId: RECEIPT,
      password: PASSWORD,
    }),
    createAckProof({
      context,
      receiptId: RECEIPT,
      password: PASSWORD,
      now: Date.now() - TTL_MS,
    }),
  ]
  for (const ackToken of tokens) {
    const response = await harness.run({ action: ACK, body: { ackToken } })
    expect(response.status).toBe(CHANGED)
    expect(await response.json()).toMatchObject({ code: DELETED })
  }
  expect(harness.effects.deletes).toEqual([])
})
for (const empty of [true, false])
  test(`lost successful delete reply recovers without deleting the next head: empty=${empty}`, async () => {
    const context = createContext()
    const ackToken = createAckProof({
      context,
      receiptId: RECEIPT,
      password: PASSWORD,
    })
    const calls: number[] = []
    const harness = createHarness({
      context,
      provider: {
        delete: async ({ receiptId }) => {
          calls.push(receiptId)
          return false
        },
        receive: async () =>
          empty ? null : { ...envelope(), receiptId: RECEIPT + 1 },
      },
    })
    expect(
      (await harness.run({ action: ACK, body: { ackToken } })).status,
    ).toBe(OK)
    expect(calls).toEqual([RECEIPT])
  })
test('delete false with the same head requests retry instead of claiming success', async () => {
  const harness = createHarness({ provider: { delete: async () => false } })
  const ackToken = createAckProof({
    context: harness.context!,
    receiptId: RECEIPT,
    password: PASSWORD,
  })
  const response = await harness.run({ action: ACK, body: { ackToken } })
  expect(response.status).toBe(UNAVAILABLE)
  expect(await response.json()).toMatchObject({ code: RETRY_LATER })
})
test('damaged event is returned as failure and stays in queue', async () => {
  const harness = createHarness({
    provider: { receive: async () => ({ receiptId: RECEIPT, body: {} }) },
  })
  const response = await harness.run()
  expect(response.status).toBe(UPSTREAM)
  expect(await response.json()).toMatchObject({
    code: INVALID_UPSTREAM_RESPONSE,
  })
  expect(harness.effects.deletes).toEqual([])
})
for (const origin of [null, FOREIGN, `${ORIGIN}/path`, `${ORIGIN}#fragment`])
  test(`Origin guard denies ${origin}`, async () => {
    const harness = createHarness()
    expect((await harness.run({ origin })).status).toBe(DENIED)
    expect(harness.effects.reads).toBe(0)
  })
for (const scope of [null, INVALID, scopeB])
  test(`scope guard denies ${scope}`, async () => {
    const harness = createHarness()
    const response = await harness.run({ scope })
    expect(response.status).toBe(scope === scopeB ? CHANGED : INVALID_STATUS)
    expect(harness.effects.reads).toBe(0)
  })
for (const body of [
  {},
  { ownerEpoch: null },
  { ownerEpoch: EPOCH, extra: true },
  [],
  null,
])
  test(`receive body guard denies ${JSON.stringify(body)}`, async () => {
    const harness = createHarness()
    expect((await harness.run({ body })).status).toBe(INVALID_STATUS)
    expect(harness.effects.reads).toBe(0)
  })
test('wrong method, content type, oversized actual bytes and invalid JSON do not reach provider', async () => {
  const harness = createHarness()
  expect((await harness.run({ method: GET })).status).toBe(WRONG_METHOD)
  const invalidInputs: RequestInput[] = [
    { headers: { [CONTENT_TYPE]: INVALID } },
    { raw: INVALID },
    { raw: INVALID.repeat(MAX_BYTES), headers: { [HEADER_LENGTH]: '1' } },
  ]
  for (const input of invalidInputs) {
    const response = await harness.run(input)
    expect(response.status).toBe(INVALID_STATUS)
    expect(await response.json()).toMatchObject({ code: INVALID_REQUEST })
  }
  expect(harness.effects.reads).toBe(0)
})
test('missing session/configuration never reads; missing session clears cookie', async () => {
  const absent = createHarness({ context: null })
  expect((await absent.run()).status).toBe(NO_AUTH)
  expect(absent.effects.clears).toBe(1)
  const unavailable = createHarness({ configured: false })
  expect((await unavailable.run()).status).toBe(UNAVAILABLE)
  expect(unavailable.effects.reads).toBe(0)
})
test('upstream access failure retires cookie; transient Retry-After is preserved', async () => {
  const absent = createHarness({
    provider: {
      receive: async () => {
        throw new ReceiverError({ code: SESSION_REQUIRED })
      },
    },
  })
  expect((await absent.run()).status).toBe(NO_AUTH)
  expect(absent.effects.clears).toBe(1)
  const temporary = createHarness({
    provider: {
      receive: async () => {
        throw new ReceiverError({ code: RETRY_LATER, retryAfterMs: 1_500 })
      },
    },
  })
  const response = await temporary.run()
  expect(response.status).toBe(UNAVAILABLE)
  expect(response.headers.get(HEADER_RETRY)).toBe('2')
})
test('aborted receive never issues a proof or deletes', async () => {
  const abort = new AbortController()
  const harness = createHarness({
    provider: {
      receive: async () => {
        abort.abort()
        return envelope()
      },
    },
  })
  const response = await harness.run({ signal: abort.signal })
  expect(response.status).toBe(UNAVAILABLE)
  expect(harness.effects.deletes).toEqual([])
})
