import { expect, test } from '@playwright/test'
import { createReceiverLoop } from '@/lib/notifications/receiver-loop'
import type {
  NotificationDelivery,
  ReceiverProvider,
} from '@/lib/notifications/types'
import { envelope, NOTIFICATION_TEST } from '../notifications/constants'
import { TEST_NOTIFICATION_PROTOCOL } from '../protocol.constants'

const { NOTIFICATION_EVENT: TEST_NOTIFICATION_PROTOCOL_NOTIFICATION_EVENT } =
  TEST_NOTIFICATION_PROTOCOL

const { CREDENTIALS, SCOPE, EPOCH, RECEIPT } = NOTIFICATION_TEST
const context = {
  credentials: CREDENTIALS,
  connectionScope: SCOPE,
  expiresAt: Infinity,
}
test('queue never deletes before ACK, duplicate ACK does not repeat Delete', async () => {
  let deletes = 0
  let receives = 0
  let active = true
  const deliveries: NotificationDelivery[] = []
  const provider: ReceiverProvider = {
    settings: async () => ({ outgoingEnabled: true }),
    receive: async () => {
      receives += 1
      return envelope()
    },
    delete: async ({ receiptId }) => {
      expect(receiptId).toBe(RECEIPT)
      deletes += 1
      active = false
      return true
    },
  }
  const loop = createReceiverLoop({
    context,
    ownerEpoch: EPOCH,
    active: () => active,
    emit: ({ event, data }) => {
      if (event === TEST_NOTIFICATION_PROTOCOL_NOTIFICATION_EVENT)
        deliveries.push(data as NotificationDelivery)
      return true
    },
    operation: () => undefined,
    pause: () => undefined,
    provider,
    sleep: async () => undefined,
  })
  loop.wake()
  await expect.poll(() => deliveries.length).toBe(1)
  expect(deletes).toBe(0)
  expect(receives).toBe(1)
  expect(loop.ack('foreign-delivery')).toBe(false)
  expect(loop.ack(deliveries[0].deliveryId)).toBe(true)
  expect(loop.ack(deliveries[0].deliveryId)).toBe(true)
  await expect.poll(() => deletes).toBe(1)
  loop.stop()
})
test('disconnect retains unconfirmed receipt and reconnect replays the same delivery', async () => {
  let active = true
  let deletes = 0
  const deliveries: NotificationDelivery[] = []
  const provider: ReceiverProvider = {
    settings: async () => ({ outgoingEnabled: true }),
    receive: async () => envelope(),
    delete: async () => {
      deletes += 1
      return true
    },
  }
  const loop = createReceiverLoop({
    context,
    ownerEpoch: EPOCH,
    active: () => active,
    emit: ({ event, data }) => {
      if (event === TEST_NOTIFICATION_PROTOCOL_NOTIFICATION_EVENT)
        deliveries.push(data as NotificationDelivery)
      return true
    },
    operation: () => undefined,
    pause: () => undefined,
    provider,
    sleep: async () => undefined,
  })
  loop.wake()
  await expect.poll(() => deliveries.length).toBe(1)
  active = false
  expect(loop.ack(deliveries[0].deliveryId)).toBe(false)
  active = true
  loop.wake()
  await expect.poll(() => deliveries.length).toBe(2)
  expect(deliveries[1]).toEqual(deliveries[0])
  expect(deletes).toBe(0)
  loop.stop()
})
