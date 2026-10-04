import { afterEach, expect, test } from 'vitest'
import { notificationFixture } from '../fixtures/query-app/lib/notification-fixture'
import { TEST_API_CODE } from '../protocol.constants'

afterEach(() => notificationFixture.reset())

test('reset creates a fresh queue, counters and context', () => {
  notificationFixture.reset()
  const previousState = notificationFixture.state
  const previousContext = notificationFixture.context
  notificationFixture.inject({ text: 'old event' })
  previousState.claims = 2
  notificationFixture.reset()

  expect(notificationFixture.state).not.toBe(previousState)
  expect(notificationFixture.context).not.toBe(previousContext)
  expect(notificationFixture.state).toMatchObject({
    queue: [],
    sends: [],
    deletes: [],
    receipt: 0,
    claims: 0,
  })
  expect(previousState.queue).toHaveLength(1)
})

test('a send started before reset cannot publish into the next scenario', async () => {
  notificationFixture.reset()
  notificationFixture.state.sendDelay = 0
  const pending = notificationFixture.send({
    chatId: 'fictional-chat',
    credentials: notificationFixture.context.credentials,
    message: 'fictional text',
  })
  notificationFixture.reset()

  await expect(pending).resolves.toEqual({
    kind: TEST_API_CODE.OUTCOME_UNKNOWN,
  })
  expect(notificationFixture.state.sends).toEqual([])
})
