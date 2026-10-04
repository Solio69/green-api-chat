import { expect, test } from 'vitest'
import { createConnectionSession } from '@/features/conversation/application/create-connection-session'
import {
  applyMessageFacts,
  messageKey,
} from '@/features/conversation/messages/application/message-cache'
import { applyNotification } from '@/features/conversation/notifications/application/apply-notification'
import { normalizeNotification } from '@/features/conversation/notifications/model/normalize-notification'
import type { NotificationDelivery } from '@/features/conversation/notifications/model/types'
import {
  deriveUnreadCounts,
  setReadableConversation,
  unreadKey,
} from '@/features/conversation/unread/application/unread-cache'
import type { UnreadCache } from '@/features/conversation/unread/application/unread-cache'
import type { QuerySession } from '@/shared/query/create-query-session'
import { MESSAGE_SOURCE } from '@/features/conversation/messages/model/constants'
import {
  NOTIFICATION_CONFIG,
  NOTIFICATION_KIND,
} from '@/features/conversation/notifications/model/constants'
import { envelope, NOTIFICATION_TEST } from '../notifications/constants'
import {
  TEST_MESSAGE_PROTOCOL,
  TEST_NOTIFICATION_PROTOCOL,
} from '../protocol.constants'
import { UNREAD_TEST } from '../unread/constants'

const { INCOMING_KIND } = TEST_NOTIFICATION_PROTOCOL
const { CREDENTIALS, SCOPE, EPOCH, CHAT, RECEIPT, MESSAGE } = NOTIFICATION_TEST
const {
  KEY,
  OTHER_CHAT,
  SECOND_MESSAGE,
  STALE_SCOPE,
  STALE_OWNER,
  FOREIGN_DELIVERY,
} = UNREAD_TEST
const { UNSUPPORTED, READ, OUTGOING } = TEST_MESSAGE_PROTOCOL
const { HISTORY } = MESSAGE_SOURCE
const { STATUS, IGNORED } = NOTIFICATION_KIND
const { IGNORED_REASON } = NOTIFICATION_CONFIG
const delivery = ({
  chatId = CHAT,
  idMessage = MESSAGE,
}: { chatId?: string; idMessage?: string } = {}): NotificationDelivery => {
  const normalized = normalizeNotification({
    value: envelope(),
    credentials: CREDENTIALS,
  })!
  if (normalized.event.kind !== INCOMING_KIND) throw new Error(FOREIGN_DELIVERY)
  return {
    connectionScope: SCOPE,
    ownerEpoch: EPOCH,
    deliveryId: String(RECEIPT),
    event: {
      ...normalized.event,
      chatId,
      message: { ...normalized.event.message, chatId, idMessage },
    },
  }
}
const apply = ({
  session,
  value = delivery(),
}: {
  session: QuerySession
  value?: NotificationDelivery
}) => applyNotification({ session, delivery: value, ownerEpoch: EPOCH })
const read = (session: QuerySession) =>
  session.client.getQueryData<UnreadCache>(unreadKey(SCOPE))
const count = ({
  session,
  chatId = CHAT,
}: {
  session: QuerySession
  chatId?: string
}) => deriveUnreadCounts(read(session)).countsByChatId[chatId] ?? 0

test('unread: incoming notification records one unique unread message before ACK', async () => {
  const session = createConnectionSession({ connectionScope: SCOPE })
  try {
    expect(apply({ session })).toBe(true)
    expect(session.client.getQueryData([KEY, SCOPE])).toMatchObject({
      unreadByChatId: { [CHAT]: [MESSAGE] },
    })
  } finally {
    await session.close()
  }
})

test('unread: unique IDs increment, replays before and after reading do not', async () => {
  const session = createConnectionSession({ connectionScope: SCOPE })
  apply({ session })
  apply({ session })
  apply({ session, value: delivery({ idMessage: SECOND_MESSAGE }) })
  expect(count({ session })).toBe(2)
  setReadableConversation({ session, chatId: CHAT })
  expect(count({ session })).toBe(0)
  setReadableConversation({ session, chatId: null })
  apply({ session })
  apply({ session, value: delivery({ idMessage: SECOND_MESSAGE }) })
  expect(count({ session })).toBe(0)
  await session.close()
})

test('unread: chat identity isolates equal IDs and reading clears only one chat', async () => {
  const session = createConnectionSession({ connectionScope: SCOPE })
  apply({ session })
  apply({ session, value: delivery({ chatId: OTHER_CHAT }) })
  expect(deriveUnreadCounts(read(session)).total).toBe(2)
  setReadableConversation({ session, chatId: CHAT })
  expect(count({ session })).toBe(0)
  expect(count({ session, chatId: OTHER_CHAT })).toBe(1)
  await session.close()
})

test('unread: visible conversation consumes incoming, hidden conversation counts and return clears', async () => {
  const session = createConnectionSession({ connectionScope: SCOPE })
  setReadableConversation({ session, chatId: CHAT })
  apply({ session })
  expect(count({ session })).toBe(0)
  setReadableConversation({ session, chatId: null })
  apply({ session, value: delivery({ idMessage: SECOND_MESSAGE }) })
  expect(count({ session })).toBe(1)
  setReadableConversation({ session, chatId: CHAT })
  expect(count({ session })).toBe(0)
  await session.close()
})

test('unread: history and outgoing facts do not count or erase incoming marks', async () => {
  const session = createConnectionSession({ connectionScope: SCOPE })
  const value = delivery()
  if (value.event.kind !== INCOMING_KIND) throw new Error(FOREIGN_DELIVERY)
  applyMessageFacts({
    session,
    chatId: CHAT,
    messages: [value.event.message],
    source: HISTORY,
  })
  expect(count({ session })).toBe(0)
  apply({ session })
  applyMessageFacts({
    session,
    chatId: CHAT,
    messages: [
      {
        ...value.event.message,
        idMessage: SECOND_MESSAGE,
        direction: OUTGOING,
        status: READ,
      },
    ],
    source: HISTORY,
  })
  expect(count({ session })).toBe(1)
  expect(
    session.client.getQueryData(
      messageKey({ connectionScope: SCOPE, chatId: CHAT }),
    ),
  ).toBeDefined()
  await session.close()
})

test('unread: unsupported incoming counts once, status and ignored events do not count', async () => {
  const session = createConnectionSession({ connectionScope: SCOPE })
  const value = delivery()
  if (value.event.kind !== INCOMING_KIND) throw new Error(FOREIGN_DELIVERY)
  apply({
    session,
    value: {
      ...value,
      event: {
        ...value.event,
        message: { ...value.event.message, kind: UNSUPPORTED, text: null },
      },
    },
  })
  apply({
    session,
    value: {
      ...value,
      event: {
        kind: STATUS,
        fact: {
          chatId: CHAT,
          idMessage: SECOND_MESSAGE,
          status: READ,
          timestamp: null,
        },
      },
    },
  })
  apply({
    session,
    value: { ...value, event: { kind: IGNORED, reason: IGNORED_REASON } },
  })
  expect(count({ session })).toBe(1)
  await session.close()
})

test('unread: foreign owner, scope and invalid events cannot mutate marks', async () => {
  const session = createConnectionSession({ connectionScope: SCOPE })
  const value = delivery()
  expect(
    apply({ session, value: { ...value, connectionScope: STALE_SCOPE } }),
  ).toBe(false)
  expect(apply({ session, value: { ...value, ownerEpoch: STALE_OWNER } })).toBe(
    false,
  )
  if (value.event.kind !== INCOMING_KIND) throw new Error(FOREIGN_DELIVERY)
  expect(
    apply({
      session,
      value: {
        ...value,
        event: {
          ...value.event,
          message: { ...value.event.message, direction: OUTGOING },
        },
      },
    }),
  ).toBe(false)
  expect(read(session)).toBeUndefined()
  await session.close()
})

test('unread: memory defaults never refetch and close prevents resurrection or cross-scope reuse', async () => {
  const session = createConnectionSession({ connectionScope: SCOPE })
  apply({ session })
  expect(session.client.getQueryDefaults([KEY])).toMatchObject({
    gcTime: Infinity,
    enabled: false,
    retry: false,
    refetchOnWindowFocus: false,
  })
  await session.close()
  expect(apply({ session })).toBe(false)
  setReadableConversation({ session, chatId: CHAT })
  expect(session.client.getQueryCache().getAll()).toHaveLength(0)
  const next = createConnectionSession({ connectionScope: STALE_SCOPE })
  expect(
    deriveUnreadCounts(next.client.getQueryData(unreadKey(STALE_SCOPE))).total,
  ).toBe(0)
  await next.close()
})
