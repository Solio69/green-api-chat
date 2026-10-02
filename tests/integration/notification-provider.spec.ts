import { expect, test } from '@playwright/test'
import { deleteNotification } from '@/lib/green-api/delete-notification'
import { getNotificationSettings } from '@/lib/green-api/get-notification-settings'
import { receiveNotification } from '@/lib/green-api/receive-notification'
import { envelope, NOTIFICATION_TEST } from '../notifications/constants'
import {
  TEST_PROVIDER_PROTOCOL,
  TEST_HTTP_PROTOCOL,
} from '../protocol.constants'

const CONFIGURED_WEBHOOK_URL = 'https://invalid.example/webhook'

const {
  TELEGRAM: TEST_PROVIDER_PROTOCOL_TELEGRAM,
  YES: TEST_PROVIDER_PROTOCOL_YES,
} = TEST_PROVIDER_PROTOCOL
const { GET: TEST_HTTP_PROTOCOL_GET, DELETE: TEST_HTTP_PROTOCOL_DELETE } =
  TEST_HTTP_PROTOCOL

const { CREDENTIALS, SCOPE, RECEIPT } = NOTIFICATION_TEST
const context = {
  credentials: CREDENTIALS,
  connectionScope: SCOPE,
  expiresAt: Infinity,
}
const settings = {
  typeInstance: TEST_PROVIDER_PROTOCOL_TELEGRAM,
  webhookUrl: '',
  incomingWebhook: TEST_PROVIDER_PROTOCOL_YES,
  outgoingMessageWebhook: TEST_PROVIDER_PROTOCOL_YES,
  outgoingAPIMessageWebhook: TEST_PROVIDER_PROTOCOL_YES,
  outgoingWebhook: TEST_PROVIDER_PROTOCOL_YES,
}
test('preflight validates HTTP API settings and reports outgoing availability', async () => {
  const fetcher: typeof fetch = async (input) => {
    expect(String(input)).toContain('/getSettings/')
    return Response.json(settings)
  }
  expect(await getNotificationSettings({ context, fetcher })).toEqual({
    outgoingEnabled: true,
  })
  await expect(
    getNotificationSettings({
      context,
      fetcher: async () =>
        Response.json({
          ...settings,
          webhookUrl: CONFIGURED_WEBHOOK_URL,
        }),
    }),
  ).rejects.toThrow('notifications_not_configured')
})
test('Receive uses GET with 5-second polling and empty response is empty queue', async () => {
  const fetcher: typeof fetch = async (input, init) => {
    expect(String(input)).toContain('?receiveTimeout=5')
    expect(init?.method).toBe(TEST_HTTP_PROTOCOL_GET)
    return Response.json(envelope())
  }
  expect(
    await receiveNotification({
      context,
      signal: new AbortController().signal,
      fetcher,
    }),
  ).toEqual(envelope())
  expect(
    await receiveNotification({
      context,
      signal: new AbortController().signal,
      fetcher: async () => new Response(null),
    }),
  ).toBeNull()
})
test('Delete uses DELETE with exact receipt and does not expose provider reason', async () => {
  const fetcher: typeof fetch = async (input, init) => {
    expect(String(input)).toContain(
      `/deleteNotification/${CREDENTIALS.apiTokenInstance}/${RECEIPT}`,
    )
    expect(init?.method).toBe(TEST_HTTP_PROTOCOL_DELETE)
    return Response.json({ result: true, reason: CREDENTIALS.apiTokenInstance })
  }
  expect(
    await deleteNotification({
      context,
      receiptId: RECEIPT,
      signal: new AbortController().signal,
      fetcher,
    }),
  ).toBe(true)
})
