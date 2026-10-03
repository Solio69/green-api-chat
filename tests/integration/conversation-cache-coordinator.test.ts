import { expect, test } from 'vitest'
import { sessionChatKey } from '@/features/chats/application'
import {
  applyAcceptedConversation,
  applyConversationDelivery,
  fetchAndApplyConversationHistory,
} from '@/lib/conversations/conversation-cache-coordinator'
import { applyMessageFacts, messageKey } from '@/lib/messages/message-cache'
import type { MessageCache, MessageDTO } from '@/lib/messages/types'
import { normalizeNotification } from '@/lib/notifications/normalize-notification'
import { createQuerySession } from '@/lib/query/create-query-session'
import { deriveUnreadCounts, unreadKey } from '@/lib/unread/unread-cache'
import type { UnreadCache } from '@/lib/unread/unread-cache'
import { HISTORY_TEST } from '../history/constants'
import { envelope, NOTIFICATION_TEST } from '../notifications/constants'

const { scopeA, chatA, message } = HISTORY_TEST
const { CREDENTIALS, SCOPE, EPOCH, CHAT, RECEIPT } = NOTIFICATION_TEST

test('late history preserves a live fact and confirmed read within one cache application', async () => {
  const session = createQuerySession({ connectionScope: scopeA })
  const reply = Promise.withResolvers<Response>()
  const base: MessageDTO = { ...message, direction: 'outgoing' }
  const live: MessageDTO = { ...base, text: 'fictional live', status: 'read' }
  const history: MessageDTO = {
    ...base,
    text: 'fictional old history',
    status: 'delivered',
  }
  const pending = fetchAndApplyConversationHistory({
    session,
    chatId: chatA,
    signal: new AbortController().signal,
    fetcher: async () => reply.promise,
  })
  applyMessageFacts({
    session,
    chatId: chatA,
    messages: [live],
    source: 'live',
  })
  reply.resolve(
    Response.json({
      status: 'ok',
      connectionScope: scopeA,
      chatId: chatA,
      messages: [history],
    }),
  )
  expect(await pending).toEqual([history])
  const cache = session.client.getQueryData<MessageCache>(
    messageKey({ connectionScope: scopeA, chatId: chatA }),
  )
  expect(cache?.messages).toEqual([live])
  await session.close()
})

test('accepted event writes message and temporary chat, invalid target leaves both absent', async () => {
  const session = createQuerySession({ connectionScope: scopeA })
  const target = { chatId: chatA, label: 'Fictional recipient' }
  applyAcceptedConversation({
    session,
    target,
    idMessage: 'fictional-accepted',
    text: 'fictional text',
    acceptedAt: 1_000,
  })
  const cache = session.client.getQueryData<MessageCache>(
    messageKey({ connectionScope: scopeA, chatId: chatA }),
  )
  expect(cache?.messages).toMatchObject([
    {
      idMessage: 'fictional-accepted',
      text: 'fictional text',
      status: 'accepted',
    },
  ])
  expect(session.client.getQueryData(sessionChatKey(scopeA))).toMatchObject({
    factsByChatId: { [chatA]: { chatId: chatA } },
  })
  const before = session.client.getQueryCache().getAll().length
  expect(() =>
    applyAcceptedConversation({
      session,
      target: { chatId: 'fictional-other-chat', label: '' },
      idMessage: 'fictional-invalid',
      text: 'fictional text',
      acceptedAt: 2_000,
    }),
  ).toThrow()
  expect(session.client.getQueryCache().getAll()).toHaveLength(before)
  await session.close()
})

test('incoming delivery updates message, temporary chat and unread before ACK decision; replay is idempotent', async () => {
  const session = createQuerySession({ connectionScope: SCOPE })
  const normalized = normalizeNotification({
    value: envelope(),
    credentials: CREDENTIALS,
  })
  expect(normalized).not.toBeNull()
  if (!normalized) return
  const delivery = {
    connectionScope: SCOPE,
    ownerEpoch: EPOCH,
    deliveryId: String(RECEIPT),
    event: normalized.event,
  }
  let refreshes = 0
  const apply = () =>
    applyConversationDelivery({
      session,
      delivery,
      ownerEpoch: EPOCH,
      refreshChats: () => {
        refreshes += 1
      },
    })
  expect(apply()).toBe(true)
  expect(apply()).toBe(true)
  expect(refreshes).toBe(2)
  const cache = session.client.getQueryData<MessageCache>(
    messageKey({ connectionScope: SCOPE, chatId: CHAT }),
  )
  expect(cache?.messages).toHaveLength(1)
  expect(session.client.getQueryData(sessionChatKey(SCOPE))).toMatchObject({
    factsByChatId: { [CHAT]: { chatId: CHAT } },
  })
  const unread = session.client.getQueryData<UnreadCache>(unreadKey(SCOPE))
  expect(deriveUnreadCounts(unread).countsByChatId[CHAT]).toBe(1)
  expect(
    applyConversationDelivery({ session, delivery, ownerEpoch: 'foreign' }),
  ).toBe(false)
  expect(deriveUnreadCounts(unread).countsByChatId[CHAT]).toBe(1)
  await session.close()
})
