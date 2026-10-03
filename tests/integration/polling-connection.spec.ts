import { expect, test } from '@playwright/test'
import { createNotificationConnection } from '@/lib/notifications/create-notification-connection'
import { normalizeNotification } from '@/lib/notifications/normalize-notification'
import { createQuerySession } from '@/lib/query/create-query-session'
import { SessionQueryError } from '@/lib/query/session-query-error'
import { deriveUnreadCounts, unreadKey } from '@/lib/unread/unread-cache'
import { HISTORY_TEST } from '../history/constants'
import { envelope, NOTIFICATION_TEST } from '../notifications/constants'
import { TEST_API_RESPONSE, TEST_API_CODE } from '../protocol.constants'

const POLLING_CLIENT_TEST = {
  SETTINGS: '/api/notifications/settings',
  RECEIVE: '/api/notifications/receive',
  ACK: '/api/notifications/ack',
  TOKEN: 'fictional-ack-proof',
  TOKEN_SECOND: 'fictional-second-proof',
  CONNECTED: 'connected',
  CLOSED: 'closed',
  PAUSED: 'paused',
  LIMITED: 'limited',
  RETRYING: 'retrying',
  BUSY: 'ownership_busy',
  UNSUPPORTED: 'browser_lock_unavailable',
  INVALID: 'invalid_upstream_response',
  DELIVERY_CHANGED: 'delivery_changed',
  TIMEOUT: 3_000,
  NETWORK_ERROR: 'fictional-network-error',
} as const
const {
  SETTINGS,
  RECEIVE,
  ACK,
  TOKEN,
  TOKEN_SECOND,
  CONNECTED,
  CLOSED,
  PAUSED,
  LIMITED,
  RETRYING,
  BUSY,
  UNSUPPORTED,
  INVALID,
  DELIVERY_CHANGED,
  TIMEOUT,
  NETWORK_ERROR,
} = POLLING_CLIENT_TEST
const { OK: RESPONSE_OK, ERROR: RESPONSE_ERROR } = TEST_API_RESPONSE
const { SESSION_REQUIRED, CONNECTION_CHANGED, RETRY_LATER } = TEST_API_CODE
const { scopeA, scopeB } = HISTORY_TEST
const { CREDENTIALS } = NOTIFICATION_TEST
type FetchHandler = (options: {
  url: string
  body: Record<string, unknown>
  signal: AbortSignal
}) => Promise<Response>
const activeConnections: ReturnType<typeof createNotificationConnection>[] = []
const activeSessions: ReturnType<typeof createQuerySession>[] = []
test.afterEach(async () => {
  activeConnections.splice(0).forEach((connection) => connection.close())
  await Promise.all(activeSessions.splice(0).map((session) => session.close()))
})
const success = (extra: object = {}) =>
  Response.json({ status: RESPONSE_OK, connectionScope: scopeA, ...extra })
const delivery = ({
  body,
  token = TOKEN,
}: {
  body: Record<string, unknown>
  token?: string
}) =>
  success({
    ackToken: token,
    delivery: {
      connectionScope: scopeA,
      ownerEpoch: body.ownerEpoch,
      deliveryId: token,
      event: normalizeNotification({
        value: envelope(),
        credentials: CREDENTIALS,
      })!.event,
    },
  })
const setup = ({
  handler,
  acquireLease,
}: {
  handler?: FetchHandler
  acquireLease?: Parameters<
    typeof createNotificationConnection
  >[0]['acquireLease']
} = {}) => {
  const session = createQuerySession({
    connectionScope: scopeA,
    fetcher: async () => success({ chats: [] }),
  })
  const effects = { calls: [] as string[], releases: 0, leases: 0 }
  const fetcher: typeof fetch = async (input, init) => {
    const url = String(input)
    effects.calls.push(url)
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>
    const signal = init?.signal as AbortSignal
    if (handler) return handler({ url, body, signal })
    if (url === SETTINGS) return success({ outgoingEnabled: true })
    return success({ delivery: null, ackToken: null })
  }
  const connection = createNotificationConnection({
    session,
    fetcher,
    acquireLease:
      acquireLease ??
      (async () => {
        effects.leases += 1
        return () => {
          effects.releases += 1
        }
      }),
  })
  activeConnections.push(connection)
  activeSessions.push(session)
  return { session, connection, effects }
}
const waitForConnected = async (
  connection: ReturnType<typeof createNotificationConnection>,
) => {
  await expect
    .poll(() => connection.getSnapshot().status, { timeout: TIMEOUT })
    .toBe(CONNECTED)
}
test('loop applies a delivery before ACK and never receives again while ACK is pending', async () => {
  const ack = Promise.withResolvers<Response>()
  let reads = 0
  let acks = 0
  const { session, connection } = setup({
    handler: async ({ url, body }) => {
      if (url === SETTINGS) return success({ outgoingEnabled: true })
      if (url === RECEIVE) {
        reads += 1
        return reads === 1
          ? delivery({ body })
          : success({ delivery: null, ackToken: null })
      }
      acks += 1
      expect(
        deriveUnreadCounts(session.client.getQueryData(unreadKey(scopeA)))
          .total,
      ).toBe(1)
      return ack.promise
    },
  })
  connection.start()
  await expect.poll(() => acks).toBe(1)
  expect(reads).toBe(1)
  ack.resolve(success({ deliveryId: TOKEN }))
  await expect.poll(() => reads).toBeGreaterThan(1)
})
test('duplicate deliveries ACK twice but count once', async () => {
  let reads = 0
  let acks = 0
  const { session, connection } = setup({
    handler: async ({ url, body }) => {
      if (url === SETTINGS) return success({ outgoingEnabled: true })
      if (url === RECEIVE) {
        reads += 1
        return reads <= 2
          ? delivery({ body, token: reads === 1 ? TOKEN : TOKEN_SECOND })
          : success({ delivery: null, ackToken: null })
      }
      acks += 1
      return success({ deliveryId: body.ackToken })
    },
  })
  connection.start()
  await expect.poll(() => acks).toBe(2)
  expect(
    deriveUnreadCounts(session.client.getQueryData(unreadKey(scopeA))).total,
  ).toBe(1)
})
test('lost ACK retries the same proof without a concurrent receive', async () => {
  let reads = 0
  const tokens: unknown[] = []
  const { connection } = setup({
    handler: async ({ url, body }) => {
      if (url === SETTINGS) return success({ outgoingEnabled: true })
      if (url === RECEIVE) {
        reads += 1
        return reads === 1
          ? delivery({ body })
          : success({ delivery: null, ackToken: null })
      }
      tokens.push(body.ackToken)
      if (tokens.length === 1) throw new Error(NETWORK_ERROR)
      expect(reads).toBe(1)
      return success({ deliveryId: body.ackToken })
    },
  })
  connection.start()
  await expect.poll(() => tokens.length, { timeout: TIMEOUT }).toBe(2)
  expect(tokens).toEqual([TOKEN, TOKEN])
  await waitForConnected(connection)
})
test('expired ACK obtains a fresh proof without duplicating incoming facts', async () => {
  let reads = 0
  let acks = 0
  const { session, connection } = setup({
    handler: async ({ url, body }) => {
      if (url === SETTINGS) return success({ outgoingEnabled: true })
      if (url === RECEIVE) {
        reads += 1
        return reads <= 2
          ? delivery({ body, token: reads === 1 ? TOKEN : TOKEN_SECOND })
          : success({ delivery: null, ackToken: null })
      }
      acks += 1
      if (acks === 1)
        return Response.json(
          { status: RESPONSE_ERROR, code: DELIVERY_CHANGED },
          { status: 409 },
        )
      return success({ deliveryId: TOKEN_SECOND })
    },
  })
  connection.start()
  await expect.poll(() => acks).toBe(2)
  expect(
    deriveUnreadCounts(session.client.getQueryData(unreadKey(scopeA))).total,
  ).toBe(1)
})
test('transient receive failure blocks sending then publishes one recovery', async () => {
  let reads = 0
  let recoveries = 0
  const { connection } = setup({
    handler: async ({ url }) => {
      if (url === SETTINGS) return success({ outgoingEnabled: true })
      reads += 1
      if (reads === 1)
        return Response.json(
          { status: RESPONSE_ERROR, code: RETRY_LATER },
          { status: 503 },
        )
      return success({ delivery: null, ackToken: null })
    },
  })
  connection.subscribeRecovery(() => {
    recoveries += 1
  })
  connection.start()
  await expect.poll(() => connection.getSnapshot().status).toBe(RETRYING)
  expect(connection.getSnapshot().canSend).toBe(false)
  await waitForConnected(connection)
  expect(recoveries).toBe(1)
})
test('busy browser lease blocks all network work and sending', async () => {
  const { connection, effects } = setup({ acquireLease: async () => null })
  connection.start()
  await expect.poll(() => connection.getSnapshot().status).toBe(LIMITED)
  expect(connection.getSnapshot()).toMatchObject({
    canSend: false,
    issue: BUSY,
  })
  expect(effects.calls).toEqual([])
})
test('unsupported browser locks do not silently create a second reader', async () => {
  const { connection, effects } = setup({
    acquireLease: async () => {
      throw new SessionQueryError({ code: UNSUPPORTED, status: null })
    },
  })
  connection.start()
  await expect.poll(() => connection.getSnapshot().issue).toBe(UNSUPPORTED)
  expect(effects.calls).toEqual([])
})
test('close during asynchronous lease acquisition releases the late lease without requests', async () => {
  const lease = Promise.withResolvers<(() => void) | null>()
  let releases = 0
  const { connection, effects } = setup({ acquireLease: () => lease.promise })
  connection.start()
  connection.close()
  lease.resolve(() => {
    releases += 1
  })
  await expect.poll(() => releases).toBe(1)
  expect(effects.calls).toEqual([])
  expect(connection.getSnapshot().status).toBe(CLOSED)
})
test('StrictMode retain release retain starts one lease and closes once', async () => {
  const { connection, effects } = setup()
  const first = connection.retain()
  first()
  const second = connection.retain()
  await waitForConnected(connection)
  expect(effects.leases).toBe(1)
  second()
  await expect.poll(() => connection.getSnapshot().status).toBe(CLOSED)
  expect(effects.releases).toBe(1)
})
test('closing during receive discards the late result and sends no ACK', async () => {
  const pending = Promise.withResolvers<Response>()
  let incomingBody: Record<string, unknown> = {}
  const { session, connection, effects } = setup({
    handler: async ({ url, body }) => {
      if (url === SETTINGS) return success({ outgoingEnabled: true })
      incomingBody = body
      return pending.promise
    },
  })
  connection.start()
  await expect.poll(() => effects.calls.includes(RECEIVE)).toBe(true)
  connection.close()
  pending.resolve(delivery({ body: incomingBody }))
  await expect.poll(() => effects.releases).toBe(1)
  expect(effects.calls).not.toContain(ACK)
  expect(
    deriveUnreadCounts(session.client.getQueryData(unreadKey(scopeA))).total,
  ).toBe(0)
})
test('closing during ACK ignores the late confirmation and releases the lease', async () => {
  const ack = Promise.withResolvers<Response>()
  const { connection, effects } = setup({
    handler: async ({ url, body }) => {
      if (url === SETTINGS) return success({ outgoingEnabled: true })
      if (url === RECEIVE) return delivery({ body })
      return ack.promise
    },
  })
  connection.start()
  await expect.poll(() => effects.calls.includes(ACK)).toBe(true)
  connection.close()
  ack.resolve(success({ deliveryId: TOKEN }))
  await expect.poll(() => effects.releases).toBe(1)
  expect(connection.getSnapshot().status).toBe(CLOSED)
  expect(effects.calls.filter((url) => url === RECEIVE)).toHaveLength(1)
})
for (const failure of [
  { status: 401, code: SESSION_REQUIRED },
  { status: 409, code: CONNECTION_CHANGED },
])
  test(`access failure closes Query and releases lock: ${failure.code}`, async () => {
    const { session, connection, effects } = setup({
      handler: async () =>
        Response.json(
          { status: RESPONSE_ERROR, code: failure.code },
          { status: failure.status },
        ),
    })
    connection.start()
    await expect.poll(session.isActive).toBe(false)
    expect(effects.releases).toBe(1)
  })
test('wrong scope or invalid delivery pauses without applying or acknowledging', async () => {
  const { session, connection, effects } = setup({
    handler: async ({ url, body }) => {
      if (url === SETTINGS) return success({ outgoingEnabled: true })
      const response = await delivery({ body }).json()
      response.delivery.connectionScope = scopeB
      return success(response)
    },
  })
  connection.start()
  await expect.poll(() => connection.getSnapshot().status).toBe(PAUSED)
  expect(connection.getSnapshot().issue).toBe(INVALID)
  expect(effects.calls).not.toContain(ACK)
  expect(
    deriveUnreadCounts(session.client.getQueryData(unreadKey(scopeA))).total,
  ).toBe(0)
})
test('manual retry while receive is pending cancels it and keeps one browser lease', async () => {
  let reads = 0
  const { connection, effects } = setup({
    handler: async ({ url, signal }) => {
      if (url === SETTINGS) return success({ outgoingEnabled: true })
      reads += 1
      if (reads === 1)
        return new Promise((_resolve, reject) =>
          signal.addEventListener(
            'abort',
            () => reject(new Error(NETWORK_ERROR)),
            { once: true },
          ),
        )
      return success({ delivery: null, ackToken: null })
    },
  })
  connection.start()
  await expect.poll(() => reads).toBe(1)
  const owner = connection.captureOwnerContext()
  await connection.retry()
  await expect.poll(() => reads).toBeGreaterThan(1)
  expect(effects.leases).toBe(1)
  expect(connection.captureOwnerContext()).toEqual(owner)
})

test('disabled outgoing status webhooks warn without blocking message send', async () => {
  const { connection, effects } = setup({
    handler: async ({ url }) =>
      url === SETTINGS
        ? success({ outgoingEnabled: false })
        : success({ delivery: null, ackToken: null }),
  })
  connection.start()
  await waitForConnected(connection)
  expect(connection.getSnapshot()).toEqual({
    status: CONNECTED,
    canSend: true,
    issue: 'outgoing_notifications_disabled',
  })
  await expect.poll(() => effects.calls.includes(RECEIVE)).toBe(true)
})
