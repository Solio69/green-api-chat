import { expect, test } from '@playwright/test'
import { normalizeNotification } from '@/lib/notifications/normalize-notification'
import { createReceiverLoop } from '@/lib/notifications/receiver-loop'
import {
  ReceiverError,
  createReceiverRegistry,
} from '@/lib/notifications/receiver-registry'
import type {
  NotificationDelivery,
  ReceiverProvider,
} from '@/lib/notifications/types'
import { isNotificationDelivery } from '@/lib/notifications/validate-delivery'
import { NOTIFICATION_TEST, envelope } from '../notifications/constants'
import {
  TEST_API_RESPONSE,
  TEST_NOTIFICATION_PROTOCOL,
} from '../protocol.constants'

const { OK: TEST_API_RESPONSE_OK } = TEST_API_RESPONSE
const {
  RECEIVER_NOT_ACTIVE: TEST_NOTIFICATION_PROTOCOL_RECEIVER_NOT_ACTIVE,
  NOT_OWNER: TEST_NOTIFICATION_PROTOCOL_NOT_OWNER,
  IGNORED: TEST_NOTIFICATION_PROTOCOL_IGNORED,
} = TEST_NOTIFICATION_PROTOCOL

const { CREDENTIALS, SCOPE } = NOTIFICATION_TEST
const HEALTH_TEST = {
  RETRYING: 'retrying',
  RECEIVING: 'receiving',
  STATE_EVENT: 'receiver_state',
  SESSION_REQUIRED: 'session_required',
  BOT: 'bot',
  ATTEMPT: 'health-attempt',
  BACKOFF_THRESHOLD_MS: 100,
  RETRY_LATER: 'retry_later',
  PHASES: ['receive', 'delete'],
} as const
const context = {
  credentials: CREDENTIALS,
  connectionScope: SCOPE,
  expiresAt: Date.now() + 60_000,
}
const provider = {
  settings: async () => ({ outgoingEnabled: true }),
  receive: async () => null,
  delete: async () => true,
}

test('server send guard rejects retrying receiver until a successful receive restores health', async () => {
  let emit!: (frame: { event: string; data: unknown }) => boolean
  const registry = createReceiverRegistry({
    provider,
    startReceiver: (options) => {
      emit = options.emit
      return { wake: () => undefined, stop: () => undefined, ack: () => false }
    },
  })
  const claim = await registry.claimOwner(context)
  expect(claim.kind).toBe(TEST_API_RESPONSE_OK)
  if (claim.kind !== TEST_API_RESPONSE_OK) return
  const owned = { ...context, ownerCapability: claim.ownerCapability }
  registry.attachOwner({
    context: owned,
    sink: { emit: () => true, close: () => undefined },
  })
  emit({
    event: HEALTH_TEST.STATE_EVENT,
    data: { state: HEALTH_TEST.RETRYING },
  })
  expect(
    registry.tryAcquireSend({ ...owned, attemptId: HEALTH_TEST.ATTEMPT }).kind,
  ).toBe(TEST_NOTIFICATION_PROTOCOL_RECEIVER_NOT_ACTIVE)
  emit({
    event: HEALTH_TEST.STATE_EVENT,
    data: { state: HEALTH_TEST.RECEIVING },
  })
  const lease = registry.tryAcquireSend({
    ...owned,
    attemptId: HEALTH_TEST.ATTEMPT,
  })
  expect(lease.kind).toBe(TEST_API_RESPONSE_OK)
  if (lease.kind === TEST_API_RESPONSE_OK) lease.release()
  registry.shutdown()
})

test('provider auth rejection immediately revokes the matching owner', async () => {
  let pause!: (code: string) => void
  const registry = createReceiverRegistry({
    provider,
    startReceiver: (options) => {
      pause = options.pause
      return { wake: () => undefined, stop: () => undefined, ack: () => false }
    },
  })
  const claim = await registry.claimOwner(context)
  expect(claim.kind).toBe(TEST_API_RESPONSE_OK)
  if (claim.kind !== TEST_API_RESPONSE_OK) return
  const owned = { ...context, ownerCapability: claim.ownerCapability }
  registry.attachOwner({
    context: owned,
    sink: { emit: () => true, close: () => undefined },
  })
  pause(HEALTH_TEST.SESSION_REQUIRED)
  expect(
    registry.tryAcquireSend({ ...owned, attemptId: HEALTH_TEST.ATTEMPT }).kind,
  ).toBe(TEST_NOTIFICATION_PROTOCOL_NOT_OWNER)
  expect((await registry.claimOwner(context)).kind).toBe(TEST_API_RESPONSE_OK)
  registry.shutdown()
})

test('valid bot notification is deliberately ignored instead of poisoning the queue', () => {
  const value = envelope({
    senderData: { chatId: NOTIFICATION_TEST.CHAT, chatType: HEALTH_TEST.BOT },
  })
  expect(
    normalizeNotification({ value, credentials: CREDENTIALS })?.event.kind,
  ).toBe(TEST_NOTIFICATION_PROTOCOL_IGNORED)
})

for (const phase of HEALTH_TEST.PHASES) {
  test(`actual registry and receiver recover after a transient ${phase} failure`, async () => {
    let receives = 0
    let deletes = 0
    let backoffs = 0
    let restored = false
    let resume!: () => void
    const backoff = new Promise<void>((resolve) => {
      resume = resolve
    })
    const deliveries: NotificationDelivery[] = []
    const actualProvider: ReceiverProvider = {
      settings: provider.settings,
      receive: async () => {
        receives += 1
        const failFirstReceive = phase === 'receive' && receives === 1
        if (failFirstReceive)
          throw new ReceiverError({ code: HEALTH_TEST.RETRY_LATER })
        return envelope()
      },
      delete: async () => {
        deletes += 1
        const failFirstDelete = phase === 'delete' && deletes === 1
        if (failFirstDelete)
          throw new ReceiverError({ code: HEALTH_TEST.RETRY_LATER })
        registry.shutdown()
        return true
      },
    }
    const registry = createReceiverRegistry({
      provider: actualProvider,
      startReceiver: (options) =>
        createReceiverLoop({
          ...options,
          provider: actualProvider,
          sleep: async (delay) => {
            if (delay < HEALTH_TEST.BACKOFF_THRESHOLD_MS) return
            backoffs += 1
            await backoff
          },
        }),
    })
    try {
      const claim = await registry.claimOwner(context)
      expect(claim.kind).toBe(TEST_API_RESPONSE_OK)
      if (claim.kind !== TEST_API_RESPONSE_OK) return
      const owned = { ...context, ownerCapability: claim.ownerCapability }
      registry.attachOwner({
        context: owned,
        sink: {
          emit: ({ event, data }) => {
            if (isNotificationDelivery(data)) deliveries.push(data)
            const recovered =
              event === HEALTH_TEST.STATE_EVENT &&
              typeof data === 'object' &&
              data !== null &&
              'state' in data &&
              data.state === HEALTH_TEST.RECEIVING
            if (recovered) {
              const lease = registry.tryAcquireSend({
                ...owned,
                attemptId: HEALTH_TEST.ATTEMPT,
              })
              restored = lease.kind === TEST_API_RESPONSE_OK
              if (lease.kind === TEST_API_RESPONSE_OK) lease.release()
            }
            return true
          },
          close: () => undefined,
        },
      })
      if (phase === 'delete') {
        await expect.poll(() => deliveries.length).toBe(1)
        expect(
          registry.ackDelivery({
            context: owned,
            deliveryId: deliveries[0].deliveryId,
          }).kind,
        ).toBe(TEST_API_RESPONSE_OK)
      }
      await expect.poll(() => backoffs).toBe(1)
      expect(
        registry.tryAcquireSend({ ...owned, attemptId: HEALTH_TEST.ATTEMPT })
          .kind,
      ).toBe(TEST_NOTIFICATION_PROTOCOL_RECEIVER_NOT_ACTIVE)
      resume()
      await expect.poll(() => restored).toBe(true)
      await expect.poll(() => deliveries.length).toBe(1)
      if (phase === 'receive')
        expect(
          registry.ackDelivery({
            context: owned,
            deliveryId: deliveries[0].deliveryId,
          }).kind,
        ).toBe(TEST_API_RESPONSE_OK)
      await expect.poll(() => deletes).toBe(phase === 'delete' ? 2 : 1)
      expect(receives).toBe(2)
    } finally {
      registry.shutdown()
      resume()
    }
  })
}
