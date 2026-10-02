import { expect, test } from '@playwright/test'
import { createNotificationConnection } from '@/lib/notifications/create-notification-connection'
import { createQuerySession } from '@/lib/query/create-query-session'
import { NOTIFICATION_TEST } from '../notifications/constants'
import {
  TEST_NOTIFICATION_PROTOCOL,
  TEST_API_RESPONSE,
  TEST_HTTP_PROTOCOL,
} from '../protocol.constants'

const {
  CLAIM_SUFFIX: TEST_NOTIFICATION_PROTOCOL_CLAIM_SUFFIX,
  RELEASE_SUFFIX: TEST_NOTIFICATION_PROTOCOL_RELEASE_SUFFIX,
} = TEST_NOTIFICATION_PROTOCOL
const { OK: TEST_API_RESPONSE_OK } = TEST_API_RESPONSE
const { SSE: TEST_HTTP_PROTOCOL_SSE } = TEST_HTTP_PROTOCOL

const { SCOPE, EPOCH } = NOTIFICATION_TEST
const capability = 'r'.repeat(43)
test('explicit retry waits for matching release before making a replacement claim', async () => {
  const session = createQuerySession({ connectionScope: SCOPE })
  let claims = 0
  let releasePending = false
  let releaseComplete = false
  let resolveRelease!: () => void
  const fetcher: typeof fetch = async (input, init) => {
    const url = String(input)
    if (url.endsWith(TEST_NOTIFICATION_PROTOCOL_CLAIM_SUFFIX)) {
      claims += 1
      if (claims > 1) expect(releaseComplete).toBe(true)
      return Response.json({
        status: TEST_API_RESPONSE_OK,
        connectionScope: SCOPE,
        ownerEpoch: EPOCH,
        ownerCapability: capability,
        outgoingEnabled: true,
      })
    }
    if (url.endsWith(TEST_NOTIFICATION_PROTOCOL_RELEASE_SUFFIX)) {
      releasePending = true
      await new Promise<void>((resolve) => {
        resolveRelease = resolve
      })
      releaseComplete = true
      return Response.json({
        status: TEST_API_RESPONSE_OK,
        connectionScope: SCOPE,
      })
    }
    return new Response(
      new ReadableStream({
        start: (controller) => {
          controller.enqueue(
            new TextEncoder().encode(
              `event: ready\ndata: ${JSON.stringify({ connectionScope: SCOPE, ownerEpoch: EPOCH })}\n\n`,
            ),
          )
          init?.signal?.addEventListener('abort', () => controller.close(), {
            once: true,
          })
        },
      }),
      { headers: { 'Content-Type': TEST_HTTP_PROTOCOL_SSE } },
    )
  }
  const connection = createNotificationConnection({ session, fetcher })
  connection.start()
  await expect.poll(() => connection.getSnapshot().canSend).toBe(true)
  connection.retry()
  await expect.poll(() => releasePending).toBe(true)
  await new Promise((resolve) => setTimeout(resolve, 30))
  expect(claims).toBe(1)
  resolveRelease()
  await expect.poll(() => claims).toBe(2)
  await session.close()
  resolveRelease()
})
