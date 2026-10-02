import { expect, test } from '@playwright/test'
import { handleNotificationRequest } from '@/lib/notifications/handle-notification-request'
import type { NotificationRequestOptions } from '@/lib/notifications/handle-notification-request'
import { createReceiverRegistry } from '@/lib/notifications/receiver-registry'
import { NOTIFICATION_TEST } from '../notifications/constants'
import {
  TEST_NOTIFICATION_PROTOCOL,
  TEST_HTTP_PROTOCOL,
} from '../protocol.constants'

const FOREIGN_ORIGIN = 'https://foreign.test'
const ORIGIN_WITH_PATH = 'http://notification.test/path'

const {
  CLAIM: TEST_NOTIFICATION_PROTOCOL_CLAIM,
  STREAM: TEST_NOTIFICATION_PROTOCOL_STREAM,
  RELEASE: TEST_NOTIFICATION_PROTOCOL_RELEASE,
} = TEST_NOTIFICATION_PROTOCOL
const {
  JSON: TEST_HTTP_PROTOCOL_JSON,
  ORIGIN: TEST_HTTP_PROTOCOL_ORIGIN,
  GET: TEST_HTTP_PROTOCOL_GET,
  POST: TEST_HTTP_PROTOCOL_POST,
  CONTENT_TYPE: TEST_HTTP_PROTOCOL_CONTENT_TYPE,
} = TEST_HTTP_PROTOCOL

const API_TEST = {
  URL: 'http://notification.test',
  SCOPE: 'n'.repeat(43),
  FOREIGN_SCOPE: 'f'.repeat(43),
  OWNER_HEADER: 'X-Chat-Owner',
} as const
const { URL, SCOPE, FOREIGN_SCOPE, OWNER_HEADER } = API_TEST
const { CREDENTIALS } = NOTIFICATION_TEST
const context = {
  credentials: CREDENTIALS,
  connectionScope: SCOPE,
  expiresAt: Date.now() + 100_000,
}
const setup = () => {
  let preflights = 0
  const registry = createReceiverRegistry({
    provider: {
      settings: async () => {
        preflights += 1
        return { outgoingEnabled: true }
      },
      receive: async () => null,
      delete: async () => true,
    },
  })
  const run = ({
    action = TEST_NOTIFICATION_PROTOCOL_CLAIM,
    origin = URL,
    scope = SCOPE,
    owner,
    body = {},
    session = context,
  }: {
    action?: NotificationRequestOptions['action']
    origin?: string | null
    scope?: string
    owner?: string
    body?: unknown
    session?: typeof context | null
  } = {}) => {
    const headers = new Headers({
      'Content-Type': TEST_HTTP_PROTOCOL_JSON,
      'X-Connection-Scope': scope,
    })
    if (origin !== null) headers.set(TEST_HTTP_PROTOCOL_ORIGIN, origin)
    if (owner) headers.set(OWNER_HEADER, owner)
    const method =
      action === TEST_NOTIFICATION_PROTOCOL_STREAM
        ? TEST_HTTP_PROTOCOL_GET
        : TEST_HTTP_PROTOCOL_POST
    return handleNotificationRequest({
      action,
      request: new Request(`${URL}/api/notifications/${action}`, {
        method,
        headers,
        body:
          method === TEST_HTTP_PROTOCOL_POST ? JSON.stringify(body) : undefined,
      }),
      context: session,
      configured: true,
      registry,
      clearSession: async () => undefined,
    })
  }
  return { registry, run, preflights: () => preflights }
}
for (const origin of [null, 'null', FOREIGN_ORIGIN, ORIGIN_WITH_PATH]) {
  test(`invalid Origin ${JSON.stringify(origin)} rejects before claim effects`, async () => {
    const { registry, run, preflights } = setup()
    expect((await run({ origin })).status).toBe(403)
    expect(preflights()).toBe(0)
    registry.shutdown()
  })
}
test('claim and stream require current session scope and opaque proof', async () => {
  const { registry, run } = setup()
  expect((await run({ session: null })).status).toBe(401)
  expect((await run({ scope: FOREIGN_SCOPE })).status).toBe(409)
  const claimed = await run()
  expect(claimed.status).toBe(200)
  const body = await claimed.json()
  expect(body.ownerCapability).toMatch(/^[A-Za-z0-9_-]{43}$/)
  expect((await run()).status).toBe(409)
  expect(
    (await run({ action: TEST_NOTIFICATION_PROTOCOL_STREAM, origin: null }))
      .status,
  ).toBe(409)
  const stream = await run({
    action: TEST_NOTIFICATION_PROTOCOL_STREAM,
    owner: body.ownerCapability,
    origin: null,
  })
  expect(stream.headers.get(TEST_HTTP_PROTOCOL_CONTENT_TYPE)).toBe(
    'text/event-stream; charset=utf-8',
  )
  const reader = stream.body!.getReader()
  const first = await reader.read()
  expect(new TextDecoder().decode(first.value)).toContain('event: ready')
  await reader.cancel()
  await run({
    action: TEST_NOTIFICATION_PROTOCOL_RELEASE,
    owner: body.ownerCapability,
  })
  registry.shutdown()
})
