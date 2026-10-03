import { expect, test } from '@playwright/test'
import { SESSION_CHAT_TEST } from '../chats/session-constants'
import { chatsQueryOptions } from '@/lib/chats/chats-query-options'
import {
  rememberPersonalChat,
  deriveSessionChats,
  sessionChatKey,
  reconcileSessionChats,
} from '@/lib/chats/session-chat-facts'
import type { SessionChatCache } from '@/lib/chats/session-chat-facts'
import { createConnectionSession } from '@/lib/conversations/create-connection-session'
import { HISTORY_TEST } from '../history/constants'

const { scopeA, chatA, SUCCESS } = HISTORY_TEST
const { KEY, LABEL, PROVIDER_NAME, PROTOTYPE_ID, SOURCE } = SESSION_CHAT_TEST
const { ACCEPTED, INCOMING } = SOURCE
const profile = { chatId: chatA, name: null, username: null, phone: null }
test('session chats: successful provider confirmation consumes pending fact while retaining independent label', async () => {
  const confirmed = { ...profile, name: PROVIDER_NAME }
  const session = createConnectionSession({
    connectionScope: scopeA,
    fetcher: async () =>
      Response.json({
        status: SUCCESS,
        connectionScope: scopeA,
        chats: [confirmed],
      }),
  })
  const key = [KEY, scopeA]
  session.client.setQueryData(key, {
    factsByChatId: { [chatA]: profile },
    labelsByChatId: { [chatA]: LABEL },
  })
  await chatsQueryOptions(session).queryFn({
    signal: new AbortController().signal,
  })
  expect(session.client.getQueryData(key)).toEqual({
    factsByChatId: {},
    labelsByChatId: { [chatA]: LABEL },
  })
  expect(session.client.getQueryDefaults([KEY])).toMatchObject({
    gcTime: Infinity,
    enabled: false,
  })
  await session.close()
})
test('session chats: empty provider reply does not consume pending chat and close clears both caches', async () => {
  const session = createConnectionSession({
    connectionScope: scopeA,
    fetcher: async () =>
      Response.json({ status: SUCCESS, connectionScope: scopeA, chats: [] }),
  })
  const key = [KEY, scopeA]
  const overlay = {
    factsByChatId: { [chatA]: profile },
    labelsByChatId: { [chatA]: LABEL },
  }
  session.client.setQueryData(key, overlay)
  await chatsQueryOptions(session).queryFn({
    signal: new AbortController().signal,
  })
  expect(session.client.getQueryData(key)).toEqual(overlay)
  await session.close()
  expect(session.client.getQueryCache().getAll()).toHaveLength(0)
})

test('session chats: accepted/incoming share one fact, independent label and provider priority with safe keys', async () => {
  const session = createConnectionSession({ connectionScope: scopeA })
  const key = sessionChatKey(scopeA)
  rememberPersonalChat({
    session,
    chatId: PROTOTYPE_ID,
    label: LABEL,
    source: ACCEPTED,
  })
  rememberPersonalChat({
    session,
    chatId: PROTOTYPE_ID,
    label: null,
    source: INCOMING,
    profile: { ...profile, chatId: PROTOTYPE_ID, name: PROVIDER_NAME },
  })
  const overlay = session.client.getQueryData<SessionChatCache>(key)
  expect(Object.keys(overlay!.factsByChatId)).toEqual([PROTOTYPE_ID])
  expect(overlay!.labelsByChatId[PROTOTYPE_ID]).toBe(LABEL)
  const union = deriveSessionChats({ providerChats: [], overlay })
  expect(union).toEqual([
    { ...profile, chatId: PROTOTYPE_ID, name: PROVIDER_NAME },
  ])
  const provider = { ...profile, chatId: PROTOTYPE_ID, name: LABEL }
  expect(deriveSessionChats({ providerChats: [provider], overlay })).toEqual([
    provider,
  ])
  reconcileSessionChats({ session, providerChats: [provider] })
  expect(
    session.client.getQueryData<SessionChatCache>(key)?.factsByChatId,
  ).toEqual({})
  await session.close()
  rememberPersonalChat({
    session,
    chatId: chatA,
    label: LABEL,
    source: ACCEPTED,
  })
  expect(session.client.getQueryCache().getAll()).toHaveLength(0)
})
