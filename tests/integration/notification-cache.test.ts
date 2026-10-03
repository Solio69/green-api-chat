import { expect, test } from 'vitest'
import { sessionChatKey } from '@/features/chats/application'
import { messageKey } from '@/lib/messages/message-cache'
import { applyNotification } from '@/lib/notifications/apply-notification'
import { normalizeNotification } from '@/lib/notifications/normalize-notification'
import { createQuerySession } from '@/lib/query/create-query-session'
import { envelope, NOTIFICATION_TEST } from '../notifications/constants'
import { TEST_NOTIFICATION_PROTOCOL } from '../protocol.constants'

const { INCOMING_KIND: TEST_NOTIFICATION_PROTOCOL_INCOMING_KIND } =
  TEST_NOTIFICATION_PROTOCOL

const { CREDENTIALS, SCOPE, EPOCH, CHAT, RECEIPT } = NOTIFICATION_TEST
test('incoming facts preserve unknown chat immediately and ACK does not wait for chat refresh', async () => {
  const session = createQuerySession({ connectionScope: SCOPE })
  const normalized = normalizeNotification({
    value: envelope(),
    credentials: CREDENTIALS,
  })!
  let refreshes = 0
  const delivery = {
    connectionScope: SCOPE,
    ownerEpoch: EPOCH,
    deliveryId: String(RECEIPT),
    event: normalized.event,
  }
  expect(
    applyNotification({
      session,
      delivery,
      ownerEpoch: EPOCH,
      refreshChats: () => {
        refreshes += 1
      },
    }),
  ).toBe(true)
  expect(refreshes).toBe(1)
  expect(session.client.getQueryData(sessionChatKey(SCOPE))).toMatchObject({
    factsByChatId: { [CHAT]: { chatId: CHAT } },
  })
  applyNotification({ session, delivery, ownerEpoch: EPOCH })
  expect(
    session.client.getQueryData(
      messageKey({ connectionScope: SCOPE, chatId: CHAT }),
    ),
  ).toMatchObject({
    messages: [
      normalized.event.kind === TEST_NOTIFICATION_PROTOCOL_INCOMING_KIND
        ? normalized.event.message
        : null,
    ],
  })
  await session.close()
})
test('stale scope or owner deliveries never mutate facts', async () => {
  const session = createQuerySession({ connectionScope: SCOPE })
  const normalized = normalizeNotification({
    value: envelope(),
    credentials: CREDENTIALS,
  })!
  expect(
    applyNotification({
      session,
      ownerEpoch: EPOCH,
      delivery: {
        connectionScope: SCOPE,
        ownerEpoch: 'foreign',
        deliveryId: String(RECEIPT),
        event: normalized.event,
      },
    }),
  ).toBe(false)
  expect(session.client.getQueryCache().getAll()).toHaveLength(0)
  await session.close()
})
