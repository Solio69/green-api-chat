import { expect, test } from '@playwright/test'
import { messageKey } from '@/lib/messages/message-cache'
import { createNotificationConnection } from '@/lib/notifications/create-notification-connection'
import { normalizeNotification } from '@/lib/notifications/normalize-notification'
import { createQuerySession } from '@/lib/query/create-query-session'
import { envelope, NOTIFICATION_TEST } from '../notifications/constants'
import {
  TEST_API_RESPONSE,
  TEST_NOTIFICATION_PROTOCOL,
} from '../protocol.constants'

const { OK: TEST_API_RESPONSE_OK } = TEST_API_RESPONSE
const {
  CLAIM_SUFFIX: TEST_NOTIFICATION_PROTOCOL_CLAIM_SUFFIX,
  ACK_SUFFIX: TEST_NOTIFICATION_PROTOCOL_ACK_SUFFIX,
  RELEASE_SUFFIX: TEST_NOTIFICATION_PROTOCOL_RELEASE_SUFFIX,
} = TEST_NOTIFICATION_PROTOCOL

const { CREDENTIALS, SCOPE, EPOCH, CHAT } = NOTIFICATION_TEST
const proof = 'c'.repeat(43)
test('controller applies delivery before ACK and scope cleanup releases only its owner', async () => {
  const session = createQuerySession({
    connectionScope: SCOPE,
    fetcher: async () =>
      Response.json({
        status: TEST_API_RESPONSE_OK,
        connectionScope: SCOPE,
        chats: [],
      }),
  })
  const normalized = normalizeNotification({
    value: envelope(),
    credentials: CREDENTIALS,
  })!
  const calls: string[] = []
  const encoder = new TextEncoder()
  const fetcher: typeof fetch = async (input, init) => {
    const url = String(input)
    calls.push(url)
    if (url.endsWith(TEST_NOTIFICATION_PROTOCOL_CLAIM_SUFFIX))
      return Response.json({
        status: TEST_API_RESPONSE_OK,
        connectionScope: SCOPE,
        ownerCapability: proof,
        ownerEpoch: EPOCH,
        outgoingEnabled: true,
      })
    if (url.endsWith('/stream'))
      return new Response(
        new ReadableStream({
          start: (controller) => {
            controller.enqueue(
              encoder.encode(
                `event: ready\ndata: ${JSON.stringify({ connectionScope: SCOPE, ownerEpoch: EPOCH })}\n\nevent: notification\ndata: ${JSON.stringify({ connectionScope: SCOPE, ownerEpoch: EPOCH, deliveryId: 'delivery-1', event: normalized.event })}\n\n`,
              ),
            )
            init?.signal?.addEventListener('abort', () => controller.close(), {
              once: true,
            })
          },
        }),
        { headers: { 'Content-Type': 'text/event-stream; charset=utf-8' } },
      )
    if (url.endsWith(TEST_NOTIFICATION_PROTOCOL_ACK_SUFFIX)) {
      expect(
        session.client.getQueryData(
          messageKey({ connectionScope: SCOPE, chatId: CHAT }),
        ),
      ).toBeDefined()
      return Response.json({
        status: TEST_API_RESPONSE_OK,
        connectionScope: SCOPE,
        deliveryId: 'delivery-1',
      })
    }
    return Response.json({
      status: TEST_API_RESPONSE_OK,
      connectionScope: SCOPE,
    })
  }
  const connection = createNotificationConnection({ session, fetcher })
  connection.start()
  await expect.poll(() => connection.getSnapshot().canSend).toBe(true)
  await expect
    .poll(() =>
      calls.some((url) => url.endsWith(TEST_NOTIFICATION_PROTOCOL_ACK_SUFFIX)),
    )
    .toBe(true)
  const owner = connection.captureOwnerContext()!
  expect(connection.isCurrentOwnerContext(owner)).toBe(true)
  await session.close()
  expect(connection.captureOwnerContext()).toBeNull()
  expect(connection.isCurrentOwnerContext(owner)).toBe(false)
  expect(
    calls.filter((url) =>
      url.endsWith(TEST_NOTIFICATION_PROTOCOL_RELEASE_SUFFIX),
    ),
  ).toHaveLength(1)
})
