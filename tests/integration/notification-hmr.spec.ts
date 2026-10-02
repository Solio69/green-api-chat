import { expect, test } from '@playwright/test'
import { createReceiverRegistry } from '@/lib/notifications/receiver-registry'
import { NOTIFICATION_TEST } from '../notifications/constants'
import { TEST_API_RESPONSE } from '../protocol.constants'

const { ERROR: TEST_API_RESPONSE_ERROR } = TEST_API_RESPONSE

const { CREDENTIALS, SCOPE } = NOTIFICATION_TEST
const context = {
  credentials: CREDENTIALS,
  connectionScope: SCOPE,
  expiresAt: Date.now() + 60_000,
}
test('invalidated runtime refuses new claims and becomes drained only after active provider promise settles', async () => {
  let settle!: () => void
  const registry = createReceiverRegistry({
    provider: {
      settings: () =>
        new Promise((resolve) => {
          settle = () => resolve({ outgoingEnabled: true })
        }),
      receive: async () => null,
      delete: async () => true,
    },
  })
  const claiming = registry.claimOwner(context)
  registry.invalidate()
  expect(registry.isInvalidated()).toBe(true)
  expect(registry.isDrained()).toBe(false)
  settle()
  expect((await claiming).kind).toBe(TEST_API_RESPONSE_ERROR)
  expect(registry.isDrained()).toBe(true)
  expect((await registry.claimOwner(context)).kind).toBe(
    TEST_API_RESPONSE_ERROR,
  )
})
