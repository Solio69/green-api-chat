import { expect, test } from '@playwright/test'
import { getNotificationSettings } from '@/lib/green-api/get-notification-settings'
import { receiveNotification } from '@/lib/green-api/receive-notification'
import { createReceiverLoop } from '@/lib/notifications/receiver-loop'
import { ReceiverError } from '@/lib/notifications/receiver-registry'
import type { NotificationDelivery } from '@/lib/notifications/types'
import { envelope, NOTIFICATION_TEST } from '../notifications/constants'
import {
  TEST_API_CODE,
  TEST_NOTIFICATION_PROTOCOL,
} from '../protocol.constants'

const { SESSION_REQUIRED: TEST_API_CODE_SESSION_REQUIRED } = TEST_API_CODE
const { NOTIFICATION_EVENT: TEST_NOTIFICATION_PROTOCOL_NOTIFICATION_EVENT } =
  TEST_NOTIFICATION_PROTOCOL

const { CREDENTIALS, SCOPE, EPOCH } = NOTIFICATION_TEST
const ERROR_TEST = {
  WAIT_MS: 30_000,
  EXPIRED_BODY:
    'Instance account is expired. Renew your instance from personal area',
  OUTGOING_MISSING: {
    typeInstance: 'telegram',
    webhookUrl: '',
    incomingWebhook: 'yes',
  },
  RETRY_LATER: 'retry_later',
} as const
const context = {
  credentials: CREDENTIALS,
  connectionScope: SCOPE,
  expiresAt: Infinity,
}

test('missing outgoing toggles only disable status diagnostics and do not block required incoming settings', async () => {
  expect(
    await getNotificationSettings({
      context,
      fetcher: async () => Response.json(ERROR_TEST.OUTGOING_MISSING),
    }),
  ).toEqual({ outgoingEnabled: false })
})

test('documented expired instance response terminates the session rather than suggesting webhook settings', async () => {
  await expect(
    receiveNotification({
      context,
      signal: new AbortController().signal,
      fetcher: async () =>
        new Response(ERROR_TEST.EXPIRED_BODY, { status: 400 }),
    }),
  ).rejects.toMatchObject({ code: TEST_API_CODE_SESSION_REQUIRED })
})

test('Delete retry respects provider Retry-After and never becomes a fast loop', async () => {
  let active = true
  const delays: number[] = []
  let delivery: NotificationDelivery | null = null
  const loop = createReceiverLoop({
    context,
    ownerEpoch: EPOCH,
    active: () => active,
    emit: ({ event, data }) => {
      if (event === TEST_NOTIFICATION_PROTOCOL_NOTIFICATION_EVENT)
        delivery = data as NotificationDelivery
      return true
    },
    operation: () => undefined,
    pause: () => undefined,
    sleep: async (delay) => {
      delays.push(delay)
      if (delay >= 1000) active = false
    },
    provider: {
      settings: async () => ({ outgoingEnabled: true }),
      receive: async () => envelope(),
      delete: async () => {
        throw new ReceiverError({
          code: ERROR_TEST.RETRY_LATER,
          retryAfterMs: ERROR_TEST.WAIT_MS,
        })
      },
    },
  })
  loop.wake()
  await expect.poll(() => delivery !== null).toBe(true)
  expect(
    loop.ack((delivery as unknown as NotificationDelivery).deliveryId),
  ).toBe(true)
  await expect.poll(() => active).toBe(false)
  expect(delays).toContain(ERROR_TEST.WAIT_MS)
  loop.stop()
})
