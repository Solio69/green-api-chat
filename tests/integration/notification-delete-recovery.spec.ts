import { expect, test } from '@playwright/test'
import { createReceiverLoop } from '@/lib/notifications/receiver-loop'
import type {
  NotificationDelivery,
  ReceiverProvider,
} from '@/lib/notifications/types'
import { envelope, NOTIFICATION_TEST } from '../notifications/constants'
import {
  TEST_PROVIDER_PROTOCOL,
  TEST_NOTIFICATION_PROTOCOL,
  TEST_API_CODE,
} from '../protocol.constants'

const { TEXT_MESSAGE: TEST_PROVIDER_PROTOCOL_TEXT_MESSAGE } =
  TEST_PROVIDER_PROTOCOL
const {
  NOTIFICATION_EVENT: TEST_NOTIFICATION_PROTOCOL_NOTIFICATION_EVENT,
  DELETE_FAILED: TEST_NOTIFICATION_PROTOCOL_DELETE_FAILED,
} = TEST_NOTIFICATION_PROTOCOL
const { INVALID_UPSTREAM_RESPONSE: TEST_API_CODE_INVALID_UPSTREAM_RESPONSE } =
  TEST_API_CODE

const { CREDENTIALS, SCOPE, EPOCH } = NOTIFICATION_TEST
const context = {
  credentials: CREDENTIALS,
  connectionScope: SCOPE,
  expiresAt: Infinity,
}
for (const mode of ['same', 'changed', 'next', 'empty'] as const) {
  test(`Delete failure revalidates ${mode} queue head without applying stale ACK`, async () => {
    let active = true
    let received = 0
    let deleted = 0
    let paused: string | null = null
    const deliveries: NotificationDelivery[] = []
    const provider: ReceiverProvider = {
      settings: async () => ({ outgoingEnabled: true }),
      receive: async () => {
        received += 1
        if (received === 1) return envelope()
        if (mode === 'empty') {
          active = false
          return null
        }
        if (mode === 'changed')
          return envelope({
            messageData: {
              typeMessage: TEST_PROVIDER_PROTOCOL_TEXT_MESSAGE,
              textMessageData: { textMessage: 'Changed receipt body' },
            },
          })
        if (mode === 'next') return { ...envelope(), receiptId: 12 }
        return envelope()
      },
      delete: async () => {
        deleted += 1
        return false
      },
    }
    const loop = createReceiverLoop({
      context,
      ownerEpoch: EPOCH,
      active: () => active,
      provider,
      sleep: async () => undefined,
      operation: () => undefined,
      pause: (code) => {
        paused = code
      },
      emit: ({ event, data }) => {
        if (event === TEST_NOTIFICATION_PROTOCOL_NOTIFICATION_EVENT)
          deliveries.push(data as NotificationDelivery)
        return true
      },
    })
    loop.wake()
    await expect.poll(() => deliveries.length).toBe(1)
    loop.ack(deliveries[0].deliveryId)
    if (mode === 'same') {
      await expect
        .poll(() => paused)
        .toBe(TEST_NOTIFICATION_PROTOCOL_DELETE_FAILED)
      expect(deleted).toBe(3)
    } else if (mode === 'changed') {
      await expect
        .poll(() => paused)
        .toBe(TEST_API_CODE_INVALID_UPSTREAM_RESPONSE)
      expect(deleted).toBe(1)
    } else if (mode === 'next') {
      await expect.poll(() => deliveries.length).toBe(2)
      expect(deleted).toBe(1)
      expect(loop.ack(deliveries[0].deliveryId)).toBe(false)
    } else {
      await expect.poll(() => received).toBe(2)
      expect(deleted).toBe(1)
    }
    loop.stop()
  })
}
