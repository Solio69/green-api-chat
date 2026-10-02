import { expect, test } from '@playwright/test'
import { addAcceptedMessage, messageKey } from '@/lib/messages/message-cache'
import { messageIssuesKey } from '@/lib/messages/message-status-issues'
import type { MessageCache } from '@/lib/messages/types'
import { applyNotification } from '@/lib/notifications/apply-notification'
import { normalizeNotification } from '@/lib/notifications/normalize-notification'
import { createQuerySession } from '@/lib/query/create-query-session'
import { envelope, NOTIFICATION_TEST } from '../notifications/constants'
import { TEST_NOTIFICATION_PROTOCOL } from '../protocol.constants'

const { IGNORED: TEST_NOTIFICATION_PROTOCOL_IGNORED } =
  TEST_NOTIFICATION_PROTOCOL

const { CREDENTIALS, SCOPE, EPOCH, CHAT, MESSAGE, TEXT } = NOTIFICATION_TEST
const STATUS_TEST = {
  WEBHOOK: 'outgoingMessageStatus',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
  NO_ACCOUNT: 'noAccount',
  UNKNOWN: 'provider_future_status',
  DELIVERY: 'status-delivery',
} as const
const { WEBHOOK, DELIVERED, READ, FAILED, NO_ACCOUNT, UNKNOWN, DELIVERY } =
  STATUS_TEST

for (const status of [DELIVERED, READ, FAILED, NO_ACCOUNT]) {
  test(`status DTO ${status} updates only the exact outgoing message and strips descriptions`, async () => {
    const session = createQuerySession({ connectionScope: SCOPE })
    addAcceptedMessage({
      session,
      chatId: CHAT,
      idMessage: MESSAGE,
      text: TEXT,
      acceptedAt: 1000,
    })
    const normalized = normalizeNotification({
      value: envelope({
        typeWebhook: WEBHOOK,
        chatId: CHAT,
        status,
        description: CREDENTIALS.apiTokenInstance,
      }),
      credentials: CREDENTIALS,
    })!
    expect(JSON.stringify(normalized)).not.toContain(
      CREDENTIALS.apiTokenInstance,
    )
    expect(
      applyNotification({
        session,
        ownerEpoch: EPOCH,
        delivery: {
          connectionScope: SCOPE,
          ownerEpoch: EPOCH,
          deliveryId: DELIVERY,
          event: normalized.event,
        },
      }),
    ).toBe(true)
    expect(
      session.client.getQueryData<MessageCache>(
        messageKey({ connectionScope: SCOPE, chatId: CHAT }),
      )?.messages,
    ).toMatchObject([{ idMessage: MESSAGE, status }])
    await session.close()
  })
}

for (const status of [FAILED, NO_ACCOUNT]) {
  test(`uncorrelated ${status} publishes a connection issue without guessing a bubble`, async () => {
    const session = createQuerySession({ connectionScope: SCOPE })
    const normalized = normalizeNotification({
      value: envelope({
        typeWebhook: WEBHOOK,
        chatId: undefined,
        idMessage: undefined,
        status,
      }),
      credentials: CREDENTIALS,
    })!
    expect(
      applyNotification({
        session,
        ownerEpoch: EPOCH,
        delivery: {
          connectionScope: SCOPE,
          ownerEpoch: EPOCH,
          deliveryId: DELIVERY,
          event: normalized.event,
        },
      }),
    ).toBe(true)
    expect(
      session.client.getQueryData(
        messageKey({ connectionScope: SCOPE, chatId: CHAT }),
      ),
    ).toBeUndefined()
    expect(session.client.getQueryData(messageIssuesKey(SCOPE))).toEqual([
      { chatId: null, idMessage: null, code: status },
    ])
    await session.close()
  })
}

test('unknown status is a valid ignored event; known success without identity and unsafe identifiers are rejected', () => {
  expect(
    normalizeNotification({
      value: envelope({ typeWebhook: WEBHOOK, status: UNKNOWN }),
      credentials: CREDENTIALS,
    })?.event.kind,
  ).toBe(TEST_NOTIFICATION_PROTOCOL_IGNORED)
  expect(
    normalizeNotification({
      value: envelope({ typeWebhook: WEBHOOK, status: READ }),
      credentials: CREDENTIALS,
    }),
  ).toBeNull()
  expect(
    normalizeNotification({
      value: envelope({
        typeWebhook: WEBHOOK,
        chatId: CHAT,
        idMessage: CREDENTIALS.apiTokenInstance,
        status: READ,
      }),
      credentials: CREDENTIALS,
    }),
  ).toBeNull()
})
