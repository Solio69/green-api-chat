import { expect, test } from '@playwright/test'
import { createReceiverRegistry } from '@/lib/notifications/receiver-registry'
import type {
  ReceiverContext,
  ReceiverProvider,
} from '@/lib/notifications/types'
import {
  TEST_API_RESPONSE,
  TEST_NOTIFICATION_PROTOCOL,
} from '../protocol.constants'

const { OK: TEST_API_RESPONSE_OK, ERROR: TEST_API_RESPONSE_ERROR } =
  TEST_API_RESPONSE
const {
  OWNERSHIP_BUSY: TEST_NOTIFICATION_PROTOCOL_OWNERSHIP_BUSY,
  RECEIVER_NOT_ACTIVE: TEST_NOTIFICATION_PROTOCOL_RECEIVER_NOT_ACTIVE,
  SEND_IN_PROGRESS: TEST_NOTIFICATION_PROTOCOL_SEND_IN_PROGRESS,
} = TEST_NOTIFICATION_PROTOCOL

const OWNER_TEST = {
  INSTANCE: '4100000001',
  TOKEN: 'fictional-owner-token',
  SCOPE: 'owner-scope-a',
  OTHER_SCOPE: 'owner-scope-b',
  ATTEMPT: 'test-attempt',
  GRACE: 10_000,
  START: 1_000,
} as const
const { INSTANCE, TOKEN, SCOPE, OTHER_SCOPE, ATTEMPT, GRACE, START } =
  OWNER_TEST
const context: ReceiverContext = {
  credentials: { idInstance: INSTANCE, apiTokenInstance: TOKEN },
  connectionScope: SCOPE,
  expiresAt: START + 100_000,
}
const provider: ReceiverProvider = {
  settings: async () => ({ outgoingEnabled: true }),
  receive: async () => null,
  delete: async () => true,
}
const sink = () => ({ emit: () => true, close: () => undefined })

test('owner claim is exclusive across scopes and rejects foreign capability', async () => {
  const registry = createReceiverRegistry({ provider, now: () => START })
  const claim = await registry.claimOwner(context)
  expect(claim.kind).toBe(TEST_API_RESPONSE_OK)
  if (claim.kind !== TEST_API_RESPONSE_OK) return
  const other = await registry.claimOwner({
    ...context,
    connectionScope: OTHER_SCOPE,
  })
  expect(other).toEqual({
    kind: TEST_API_RESPONSE_ERROR,
    code: TEST_NOTIFICATION_PROTOCOL_OWNERSHIP_BUSY,
  })
  expect(registry.attachOwner({ context, sink: sink() }).kind).toBe(
    TEST_API_RESPONSE_ERROR,
  )
  registry.releaseOwner({ ...context, ownerCapability: claim.ownerCapability })
})

test('send requires attached ownership and keeps semaphore until its lease settles', async () => {
  let clock = START
  const registry = createReceiverRegistry({ provider, now: () => clock })
  const claim = await registry.claimOwner(context)
  expect(claim.kind).toBe(TEST_API_RESPONSE_OK)
  if (claim.kind !== TEST_API_RESPONSE_OK) return
  const owned = { ...context, ownerCapability: claim.ownerCapability }
  const send = {
    credentials: context.credentials,
    connectionScope: SCOPE,
    ownerCapability: claim.ownerCapability,
    attemptId: ATTEMPT,
  }
  expect(registry.tryAcquireSend(send).kind).toBe(
    TEST_NOTIFICATION_PROTOCOL_RECEIVER_NOT_ACTIVE,
  )
  const attached = registry.attachOwner({ context: owned, sink: sink() })
  expect(attached.kind).toBe(TEST_API_RESPONSE_OK)
  if (attached.kind !== TEST_API_RESPONSE_OK) return
  const first = registry.tryAcquireSend(send)
  expect(first.kind).toBe(TEST_API_RESPONSE_OK)
  expect(registry.tryAcquireSend(send).kind).toBe(
    TEST_NOTIFICATION_PROTOCOL_SEND_IN_PROGRESS,
  )
  registry.detachOwner({
    context: owned,
    streamGeneration: attached.streamGeneration,
  })
  registry.releaseOwner(owned)
  clock += GRACE
  expect((await registry.claimOwner(context)).kind).toBe(
    TEST_API_RESPONSE_ERROR,
  )
  if (first.kind === TEST_API_RESPONSE_OK) {
    first.release()
    first.release()
  }
  expect((await registry.claimOwner(context)).kind).toBe(TEST_API_RESPONSE_OK)
  registry.releaseOwner(owned)
})
