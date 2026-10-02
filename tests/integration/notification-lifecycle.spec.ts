import { expect, test } from '@playwright/test'
import { createReceiverRegistry } from '@/lib/notifications/receiver-registry'
import type {
  ReceiverContext,
  ReceiverProvider,
} from '@/lib/notifications/types'
import { NOTIFICATION_TEST } from '../notifications/constants'
import {
  TEST_API_RESPONSE,
  TEST_NOTIFICATION_PROTOCOL,
} from '../protocol.constants'

const { OK: TEST_API_RESPONSE_OK, ERROR: TEST_API_RESPONSE_ERROR } =
  TEST_API_RESPONSE
const {
  DELETE_FAILED: TEST_NOTIFICATION_PROTOCOL_DELETE_FAILED,
  PAUSED: TEST_NOTIFICATION_PROTOCOL_PAUSED,
} = TEST_NOTIFICATION_PROTOCOL

const { CREDENTIALS, SCOPE } = NOTIFICATION_TEST
const LIFECYCLE_TEST = {
  START: 1_000,
  GRACE: 10_000,
  SESSION: 100_000,
  FOREIGN: 'foreign-proof',
} as const
const { START, GRACE, SESSION, FOREIGN } = LIFECYCLE_TEST
const context: ReceiverContext = {
  credentials: CREDENTIALS,
  connectionScope: SCOPE,
  expiresAt: START + SESSION,
}
const provider: ReceiverProvider = {
  settings: async () => ({ outgoingEnabled: true }),
  receive: async () => null,
  delete: async () => true,
}
const sink = () => ({ emit: () => true, close: () => undefined })
test('stale stream close never detaches a newer generation, grace permits matching reconnect only', async () => {
  let clock = START
  const registry = createReceiverRegistry({ provider, now: () => clock })
  const claim = await registry.claimOwner(context)
  expect(claim.kind).toBe(TEST_API_RESPONSE_OK)
  if (claim.kind !== TEST_API_RESPONSE_OK) return
  const owned = { ...context, ownerCapability: claim.ownerCapability }
  const first = registry.attachOwner({ context: owned, sink: sink() })
  expect(first.kind).toBe(TEST_API_RESPONSE_OK)
  if (first.kind !== TEST_API_RESPONSE_OK) return
  registry.detachOwner({
    context: owned,
    streamGeneration: first.streamGeneration,
  })
  clock += GRACE - 1
  const second = registry.attachOwner({ context: owned, sink: sink() })
  expect(second.kind).toBe(TEST_API_RESPONSE_OK)
  registry.detachOwner({
    context: owned,
    streamGeneration: first.streamGeneration,
  })
  expect(
    registry.tryAcquireSend({
      credentials: CREDENTIALS,
      connectionScope: SCOPE,
      ownerCapability: claim.ownerCapability,
      attemptId: 'attempt',
    }).kind,
  ).toBe(TEST_API_RESPONSE_OK)
  registry.releaseOwner({ ...owned, ownerCapability: FOREIGN })
  expect((await registry.claimOwner(context)).kind).toBe(
    TEST_API_RESPONSE_ERROR,
  )
  registry.shutdown()
})
test('expired unattached claim is replaced and old proof is never accepted', async () => {
  let clock = START
  const registry = createReceiverRegistry({ provider, now: () => clock })
  const first = await registry.claimOwner(context)
  expect(first.kind).toBe(TEST_API_RESPONSE_OK)
  if (first.kind !== TEST_API_RESPONSE_OK) return
  clock += GRACE
  const second = await registry.claimOwner(context)
  expect(second.kind).toBe(TEST_API_RESPONSE_OK)
  expect(
    registry.attachOwner({
      context: { ...context, ownerCapability: first.ownerCapability },
      sink: sink(),
    }).kind,
  ).toBe(TEST_API_RESPONSE_ERROR)
  registry.shutdown()
})
test('paused receiver remains visibly paused after matching reconnect', async () => {
  const frames: { event: string; data: unknown }[] = []
  const registry = createReceiverRegistry({
    provider,
    now: () => START,
    startReceiver: (options) => {
      options.pause(TEST_NOTIFICATION_PROTOCOL_DELETE_FAILED)
      return { wake: () => undefined, stop: () => undefined, ack: () => false }
    },
  })
  const claim = await registry.claimOwner(context)
  expect(claim.kind).toBe(TEST_API_RESPONSE_OK)
  if (claim.kind !== TEST_API_RESPONSE_OK) return
  const owned = { ...context, ownerCapability: claim.ownerCapability }
  const first = registry.attachOwner({
    context: owned,
    sink: {
      emit: (frame) => {
        frames.push(frame)
        return true
      },
      close: () => undefined,
    },
  })
  if (first.kind !== TEST_API_RESPONSE_OK) return
  registry.detachOwner({
    context: owned,
    streamGeneration: first.streamGeneration,
  })
  frames.length = 0
  registry.attachOwner({
    context: owned,
    sink: {
      emit: (frame) => {
        frames.push(frame)
        return true
      },
      close: () => undefined,
    },
  })
  expect(frames.at(-1)).toMatchObject({
    event: 'receiver_state',
    data: {
      state: TEST_NOTIFICATION_PROTOCOL_PAUSED,
      code: TEST_NOTIFICATION_PROTOCOL_DELETE_FAILED,
    },
  })
  registry.shutdown()
})
