import { expect, test } from '@playwright/test'
import { createNotificationConnection } from '@/lib/notifications/create-notification-connection'
import { createReceiverLoop } from '@/lib/notifications/receiver-loop'
import { createQuerySession } from '@/lib/query/create-query-session'
import { envelope, NOTIFICATION_TEST } from '../notifications/constants'
import {
  TEST_NOTIFICATION_PROTOCOL,
  TEST_API_RESPONSE,
  TEST_HTTP_PROTOCOL,
} from '../protocol.constants'

const {
  CLAIM_SUFFIX: TEST_NOTIFICATION_PROTOCOL_CLAIM_SUFFIX,
  ACK_SUFFIX: TEST_NOTIFICATION_PROTOCOL_ACK_SUFFIX,
  RELEASE_SUFFIX: TEST_NOTIFICATION_PROTOCOL_RELEASE_SUFFIX,
} = TEST_NOTIFICATION_PROTOCOL
const { OK: TEST_API_RESPONSE_OK } = TEST_API_RESPONSE
const { SSE: TEST_HTTP_PROTOCOL_SSE } = TEST_HTTP_PROTOCOL

const { CREDENTIALS, SCOPE, EPOCH } = NOTIFICATION_TEST
const SAFETY_TEST = {
  CAPABILITY: 's'.repeat(43),
  DELIVERY: 'safety-delivery',
  READY: 'ready',
  NOTIFICATION: 'notification',
  INVALID: 'invalid_upstream_response',
  PAUSED: 'paused',
  IGNORED: { kind: 'ignored', reason: 'out_of_scope' },
  MALFORMED: { kind: 'incoming_message', chatId: 'not-a-personal-id' },
} as const

test('corrupt queue head pauses the real loop without deleting or repeatedly reading it', async () => {
  let receives = 0
  let deletes = 0
  let paused: string | null = null
  const loop = createReceiverLoop({
    context: {
      credentials: CREDENTIALS,
      connectionScope: SCOPE,
      expiresAt: Infinity,
    },
    ownerEpoch: EPOCH,
    active: () => true,
    emit: () => true,
    operation: () => undefined,
    pause: (code) => {
      paused = code
    },
    sleep: async () => undefined,
    provider: {
      settings: async () => ({ outgoingEnabled: true }),
      receive: async () => {
        receives += 1
        return { ...envelope(), receiptId: -1 }
      },
      delete: async () => {
        deletes += 1
        return true
      },
    },
  })
  loop.wake()
  await expect.poll(() => paused).toBe(SAFETY_TEST.INVALID)
  loop.wake()
  expect(receives).toBe(1)
  expect(deletes).toBe(0)
  loop.stop()
})

for (const valid of [true, false]) {
  test(`client sends ACK only for validated applied or deliberately ignored delivery: valid=${valid}`, async () => {
    const session = createQuerySession({ connectionScope: SCOPE })
    let acks = 0
    const fetcher: typeof fetch = async (input, init) => {
      const url = String(input)
      if (url.endsWith(TEST_NOTIFICATION_PROTOCOL_CLAIM_SUFFIX))
        return Response.json({
          status: TEST_API_RESPONSE_OK,
          connectionScope: SCOPE,
          ownerEpoch: EPOCH,
          ownerCapability: SAFETY_TEST.CAPABILITY,
          outgoingEnabled: true,
        })
      if (url.endsWith(TEST_NOTIFICATION_PROTOCOL_ACK_SUFFIX)) {
        acks += 1
        return Response.json({
          status: TEST_API_RESPONSE_OK,
          connectionScope: SCOPE,
          deliveryId: SAFETY_TEST.DELIVERY,
        })
      }
      if (url.endsWith(TEST_NOTIFICATION_PROTOCOL_RELEASE_SUFFIX))
        return Response.json({
          status: TEST_API_RESPONSE_OK,
          connectionScope: SCOPE,
        })
      return new Response(
        new ReadableStream({
          start: (controller) => {
            const ready = { connectionScope: SCOPE, ownerEpoch: EPOCH }
            const delivery = {
              ...ready,
              deliveryId: SAFETY_TEST.DELIVERY,
              event: valid ? SAFETY_TEST.IGNORED : SAFETY_TEST.MALFORMED,
            }
            controller.enqueue(
              new TextEncoder().encode(
                `event: ${SAFETY_TEST.READY}\ndata: ${JSON.stringify(ready)}\n\nevent: ${SAFETY_TEST.NOTIFICATION}\ndata: ${JSON.stringify(delivery)}\n\n`,
              ),
            )
            init?.signal?.addEventListener(
              'abort',
              () => {
                try {
                  controller.close()
                } catch {
                  /* Reader may already be cancelled. */
                }
              },
              { once: true },
            )
          },
        }),
        { headers: { 'Content-Type': TEST_HTTP_PROTOCOL_SSE } },
      )
    }
    const connection = createNotificationConnection({ session, fetcher })
    connection.start()
    if (valid) await expect.poll(() => acks).toBe(1)
    else {
      await expect
        .poll(() => connection.getSnapshot().status)
        .toBe(SAFETY_TEST.PAUSED)
      expect(acks).toBe(0)
    }
    expect(session.client.getQueryCache().getAll()).toHaveLength(0)
    await session.close()
  })
}
