import { expect, test } from 'vitest'
import { createConnectionSession } from '@/features/conversation/application/create-connection-session'
import {
  applyMessageFacts as apply,
  messageKey,
  addAcceptedMessage,
} from '@/features/conversation/messages/application/message-cache'
import type {
  MessageDTO,
  MessageStatusFact as Status,
} from '@/features/conversation/messages/model/types'
import type { QuerySession } from '@/shared/query/create-query-session'
import { HISTORY_TEST, MESSAGE_CACHE_TEST } from '../history/constants'

const { scopeA, chatA, chatB, message, MESSAGE } = HISTORY_TEST
const { OUTGOING, READ, DELIVERED, FAILED } = MESSAGE
const {
  STATUS_FACTS_KEY,
  EARLY_FACT_TTL_MS,
  EARLY_FACT_LIMIT,
  EARLY_ID_PREFIX,
  DIFFERENT_MESSAGE_ID,
  ACCEPTED_TEXT,
  LIVE_TEXT,
  OLD_HISTORY_TEXT,
  ACCEPTED_AT,
  ACCEPTED_STATUS,
  SOURCE,
} = MESSAGE_CACHE_TEST
const { HISTORY, LIVE, ACCEPTED } = SOURCE
const read = (session: QuerySession) =>
  session.client.getQueryData<{ messages: MessageDTO[] }>(
    messageKey({ connectionScope: scopeA, chatId: chatA }),
  )?.messages
const outgoing: MessageDTO = {
  ...message,
  direction: OUTGOING,
  status: null,
}
const status = (value: Status['status']): Status => ({
  chatId: chatA,
  idMessage: message.idMessage,
  status: value,
})
const earlyId = (index: number) => `${EARLY_ID_PREFIX}${index}`

test('facts: status before a message does not create a bubble and attaches to real history', async () => {
  const session = createConnectionSession({ connectionScope: scopeA })
  apply({
    session,
    chatId: chatA,
    statuses: [status(READ)],
    source: LIVE,
  })
  expect(read(session)).toBeUndefined()
  apply({ session, chatId: chatA, messages: [outgoing], source: HISTORY })
  expect(read(session)).toEqual([{ ...outgoing, status: READ }])
  await session.close()
})
for (const first of [FAILED, DELIVERED, READ] as const) {
  test(`facts: early ${first} and conflicting later status retain confirmation and publish issue`, async () => {
    const session = createConnectionSession({ connectionScope: scopeA })
    const second = first === FAILED ? READ : FAILED
    apply({ session, chatId: chatA, statuses: [status(first)], source: LIVE })
    apply({ session, chatId: chatA, statuses: [status(second)], source: LIVE })
    const result = apply({
      session,
      chatId: chatA,
      messages: [outgoing],
      source: HISTORY,
    })
    expect(read(session)?.[0].status).toBe(
      first === DELIVERED ? DELIVERED : READ,
    )
    expect(result.issues).toContainEqual({
      chatId: chatA,
      idMessage: message.idMessage,
      code: FAILED,
    })
    await session.close()
  })
}
test('facts: duplicate does not extend TTL, stronger status renews it, expired facts never attach', async () => {
  const session = createConnectionSession({ connectionScope: scopeA })
  apply({
    session,
    chatId: chatA,
    statuses: [status(DELIVERED)],
    source: LIVE,
    now: () => 0,
  })
  apply({
    session,
    chatId: chatA,
    statuses: [status(DELIVERED)],
    source: LIVE,
    now: () => EARLY_FACT_TTL_MS - 1,
  })
  apply({
    session,
    chatId: chatA,
    messages: [outgoing],
    source: HISTORY,
    now: () => EARLY_FACT_TTL_MS,
  })
  expect(read(session)?.[0].status).toBeNull()
  await session.close()
  const next = createConnectionSession({ connectionScope: scopeA })
  apply({
    session: next,
    chatId: chatA,
    statuses: [status(DELIVERED)],
    source: LIVE,
    now: () => 0,
  })
  apply({
    session: next,
    chatId: chatA,
    statuses: [status(READ)],
    source: LIVE,
    now: () => EARLY_FACT_TTL_MS - 1,
  })
  apply({
    session: next,
    chatId: chatA,
    messages: [outgoing],
    source: HISTORY,
    now: () => EARLY_FACT_TTL_MS,
  })
  expect(read(next)?.[0].status).toBe(READ)
  await next.close()
})
test('facts: bounded early queue evicts oldest deterministically and retains GC until close', async () => {
  const session = createConnectionSession({ connectionScope: scopeA })
  const statuses = Array.from({ length: EARLY_FACT_LIMIT + 1 }, (_, index) => ({
    ...status(READ),
    idMessage: earlyId(index),
  }))
  apply({ session, chatId: chatA, statuses, source: LIVE, now: () => 0 })
  expect(session.client.getQueryDefaults([STATUS_FACTS_KEY])).toMatchObject({
    gcTime: Infinity,
    enabled: false,
  })
  apply({
    session,
    chatId: chatA,
    messages: [
      { ...outgoing, idMessage: earlyId(0) },
      { ...outgoing, idMessage: earlyId(EARLY_FACT_LIMIT) },
    ],
    source: HISTORY,
    now: () => 1,
  })
  expect(read(session)?.map((item) => item.status)).toEqual([null, READ])
  await session.close()
  expect(session.client.getQueryCache().getAll()).toHaveLength(0)
  apply({
    session,
    chatId: chatA,
    statuses: [status(READ)],
    source: LIVE,
  })
  expect(session.client.getQueryCache().getAll()).toHaveLength(0)
})
test('facts: provider fields replace accepted fields; late history preserves live content, identity and read', async () => {
  const session = createConnectionSession({ connectionScope: scopeA })
  const accepted: MessageDTO = {
    ...outgoing,
    text: ACCEPTED_TEXT,
    timestamp: null,
    acceptedAt: ACCEPTED_AT,
    status: ACCEPTED_STATUS,
  }
  const live: MessageDTO = {
    ...outgoing,
    text: LIVE_TEXT,
    status: READ,
  }
  apply({ session, chatId: chatA, messages: [accepted], source: ACCEPTED })
  apply({ session, chatId: chatA, messages: [live], source: LIVE })
  apply({
    session,
    chatId: chatA,
    messages: [{ ...outgoing, text: OLD_HISTORY_TEXT, status: DELIVERED }],
    source: HISTORY,
  })
  expect(read(session)).toEqual([{ ...live, acceptedAt: ACCEPTED_AT }])
  apply({ session, chatId: chatA, messages: [], source: HISTORY })
  expect(read(session)).toHaveLength(1)
  apply({
    session,
    chatId: chatA,
    messages: [
      { ...outgoing, idMessage: DIFFERENT_MESSAGE_ID, text: live.text },
    ],
    source: HISTORY,
  })
  expect(read(session)).toHaveLength(2)
  await session.close()
})
test('facts: validation is atomic for wrong-chat messages and partial statuses', async () => {
  const session = createConnectionSession({ connectionScope: scopeA })
  expect(() =>
    apply({
      session,
      chatId: chatA,
      messages: [outgoing],
      statuses: [{ ...status(READ), chatId: chatB }],
      source: LIVE,
    }),
  ).toThrow()
  expect(read(session)).toBeUndefined()
  await session.close()
})

test('facts: live provider content without timestamp survives later history after local acceptance', () => {
  const session = createConnectionSession({ connectionScope: scopeA })
  apply({
    session,
    chatId: chatA,
    messages: [
      {
        ...outgoing,
        text: ACCEPTED_TEXT,
        timestamp: null,
        acceptedAt: ACCEPTED_AT,
        status: ACCEPTED_STATUS,
      },
    ],
    source: ACCEPTED,
  })
  apply({
    session,
    chatId: chatA,
    messages: [{ ...outgoing, text: LIVE_TEXT, timestamp: null, status: READ }],
    source: LIVE,
  })
  apply({
    session,
    chatId: chatA,
    messages: [
      {
        ...outgoing,
        text: OLD_HISTORY_TEXT,
        timestamp: null,
        status: DELIVERED,
      },
    ],
    source: HISTORY,
  })
  expect(read(session)?.[0].text).toBe(LIVE_TEXT)
})

test('facts: accepted-message API preserves exact text, timestamp semantics and prior read', async () => {
  const session = createConnectionSession({ connectionScope: scopeA })
  apply({ session, chatId: chatA, statuses: [status(READ)], source: LIVE })
  addAcceptedMessage({
    session,
    chatId: chatA,
    idMessage: message.idMessage,
    text: message.text,
    acceptedAt: ACCEPTED_AT,
  })
  expect(read(session)).toEqual([
    { ...outgoing, timestamp: null, acceptedAt: ACCEPTED_AT, status: READ },
  ])
  await session.close()
})
