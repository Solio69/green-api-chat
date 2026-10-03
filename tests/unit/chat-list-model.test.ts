import { expect, test } from 'vitest'
import {
  deriveSessionChats,
  reconcileSessionChats,
  rememberPersonalChat,
  sessionChatKey,
} from '@/features/chats/application'
import type { SessionChatCache } from '@/features/chats/application'
import { createQuerySession } from '@/lib/query/create-query-session'

const connectionScope = 'a'.repeat(43)
const chatId = 'fictional-personal-chat'
const pending = { chatId, name: null, username: null, phone: null }

test('chat list model: an unconfirmed fact remains visible after an empty provider result', async () => {
  const session = createQuerySession({ connectionScope })
  rememberPersonalChat({
    session,
    chatId,
    label: 'Локальная подпись',
    source: 'incoming',
  })
  const overlay = session.client.getQueryData<SessionChatCache>(
    sessionChatKey(connectionScope),
  )

  expect(deriveSessionChats({ providerChats: [], overlay })).toEqual([pending])
  await session.close()
})

test('chat list model: provider confirmation replaces one pending row and keeps its label', async () => {
  const session = createQuerySession({ connectionScope })
  rememberPersonalChat({
    session,
    chatId,
    label: 'Локальная подпись',
    source: 'accepted',
    profile: { ...pending, phone: '900000000001' },
  })
  const providerChats = [{ ...pending, name: 'Подтверждённый чат' }]
  const overlay = session.client.getQueryData<SessionChatCache>(
    sessionChatKey(connectionScope),
  )
  expect(deriveSessionChats({ providerChats, overlay })).toEqual([
    { ...providerChats[0], phone: '900000000001' },
  ])

  reconcileSessionChats({ session, providerChats })
  const reconciled = session.client.getQueryData<SessionChatCache>(
    sessionChatKey(connectionScope),
  )
  expect(reconciled?.factsByChatId).toEqual({})
  expect(reconciled?.labelsByChatId[chatId]).toBe('Локальная подпись')
  await session.close()
})
