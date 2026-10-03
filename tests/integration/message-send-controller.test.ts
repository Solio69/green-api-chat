import { expect, test } from 'vitest'
import { messageKey } from '@/lib/messages/message-cache'
import { createQuerySession } from '@/lib/query/create-query-session'
import { createSendController } from '@/lib/sending/create-send-controller'
import {
  SendMessageError,
  fetchSendMessage,
} from '@/lib/sending/fetch-send-message'
import { NOTIFICATION_TEST } from '../notifications/constants'
import {
  TEST_HTTP_PROTOCOL,
  TEST_API_RESPONSE,
  TEST_MESSAGE_PROTOCOL,
  TEST_NOTIFICATION_PROTOCOL,
  TEST_API_CODE,
  TEST_API_ROUTES,
} from '../protocol.constants'

const { MESSAGES: TEST_API_ROUTES_MESSAGES } = TEST_API_ROUTES

const { CHAT_OWNER: TEST_HTTP_PROTOCOL_CHAT_OWNER } = TEST_HTTP_PROTOCOL
const { OK: TEST_API_RESPONSE_OK, ERROR: TEST_API_RESPONSE_ERROR } =
  TEST_API_RESPONSE
const { ACCEPTED: TEST_MESSAGE_PROTOCOL_ACCEPTED } = TEST_MESSAGE_PROTOCOL
const { CLOSED: TEST_NOTIFICATION_PROTOCOL_CLOSED } = TEST_NOTIFICATION_PROTOCOL
const { OUTCOME_UNKNOWN: TEST_API_CODE_OUTCOME_UNKNOWN } = TEST_API_CODE

const { SCOPE, CHAT, TEXT, EPOCH } = NOTIFICATION_TEST
const SEND_TEST = {
  OTHER_CHAT: '20000001',
  LABEL: 'Тестовый собеседник',
  ID: 'accepted-send-1',
  ATTEMPT: '8f73aa97-6cbd-4250-a1c0-d44351a65aa3',
} as const
const { OTHER_CHAT, LABEL, ID, ATTEMPT } = SEND_TEST
const owner = {
  connectionScope: SCOPE,
  ownerEpoch: EPOCH,
}
const target = { chatId: CHAT, label: LABEL }
test('client sends original text once and validates accepted correlation', async () => {
  const session = createQuerySession({ connectionScope: SCOPE })
  let requests = 0
  const fetcher: typeof fetch = async (input, init) => {
    requests += 1
    expect(String(input)).toBe(TEST_API_ROUTES_MESSAGES)
    expect(JSON.parse(String(init?.body))).toEqual({
      chatId: CHAT,
      message: TEXT,
      attemptId: ATTEMPT,
    })
    expect(
      new Headers(init?.headers).get(TEST_HTTP_PROTOCOL_CHAT_OWNER),
    ).toBeNull()
    return Response.json({
      status: TEST_API_RESPONSE_OK,
      connectionScope: SCOPE,
      chatId: CHAT,
      attemptId: ATTEMPT,
      idMessage: ID,
    })
  }
  expect(
    await fetchSendMessage({
      session,
      target,
      text: TEXT,
      attemptId: ATTEMPT,
      fetcher,
    }),
  ).toMatchObject({ idMessage: ID })
  expect(requests).toBe(1)
  await expect(
    fetchSendMessage({
      session,
      target,
      text: TEXT,
      attemptId: ATTEMPT,
      fetcher: async () =>
        Response.json({
          status: TEST_API_RESPONSE_OK,
          connectionScope: SCOPE,
          chatId: OTHER_CHAT,
          attemptId: ATTEMPT,
          idMessage: ID,
        }),
    }),
  ).rejects.toMatchObject({ outcome: 'unknown' })
  await session.close()
})
test('shared latch rejects a second send and late acceptance publishes to its captured chat', async () => {
  const session = createQuerySession({ connectionScope: SCOPE })
  let settle!: (value: Awaited<ReturnType<typeof fetchSendMessage>>) => void
  const controller = createSendController({
    session,
    canSend: () => true,
    captureOwnerContext: () => owner,
    isCurrentOwnerContext: () => true,
    dispatch: () =>
      new Promise((resolve) => {
        settle = resolve
      }),
  })
  const input = { target, text: TEXT, selectionEpoch: 1, editorRevision: 1 }
  const first = controller.send(input)
  expect(controller.getSnapshot().pendingAttempt?.target.chatId).toBe(CHAT)
  expect(
    await controller.send({
      ...input,
      target: { ...target, chatId: OTHER_CHAT },
    }),
  ).toBeNull()
  const snapshot = controller.getSnapshot().pendingAttempt!
  settle({
    status: TEST_API_RESPONSE_OK,
    connectionScope: SCOPE,
    chatId: CHAT,
    attemptId: snapshot.attemptId,
    idMessage: ID,
  })
  expect((await first)?.kind).toBe(TEST_MESSAGE_PROTOCOL_ACCEPTED)
  expect(
    session.client.getQueryData(
      messageKey({ connectionScope: SCOPE, chatId: CHAT }),
    ),
  ).toMatchObject({
    messages: [
      { idMessage: ID, text: TEXT, status: TEST_MESSAGE_PROTOCOL_ACCEPTED },
    ],
  })
  expect(
    session.client.getQueryData(
      messageKey({ connectionScope: SCOPE, chatId: OTHER_CHAT }),
    ),
  ).toBeUndefined()
  await session.close()
})

for (const disposition of [
  'grace',
  'revoked',
  TEST_NOTIFICATION_PROTOCOL_CLOSED,
] as const) {
  test(`late send result follows captured owner lifetime: ${disposition}`, async () => {
    const session = createQuerySession({ connectionScope: SCOPE })
    let connected = true
    let current = true
    let settle!: (value: Awaited<ReturnType<typeof fetchSendMessage>>) => void
    const controller = createSendController({
      session,
      canSend: () => connected,
      captureOwnerContext: () => owner,
      isCurrentOwnerContext: () => current,
      dispatch: () =>
        new Promise((resolve) => {
          settle = resolve
        }),
    })
    const sending = controller.send({
      target,
      text: TEXT,
      selectionEpoch: 1,
      editorRevision: 1,
    })
    const pending = controller.getSnapshot().pendingAttempt!
    connected = false
    if (disposition === 'revoked') current = false
    if (disposition === TEST_NOTIFICATION_PROTOCOL_CLOSED) await session.close()
    settle({
      status: TEST_API_RESPONSE_OK,
      connectionScope: SCOPE,
      chatId: CHAT,
      attemptId: pending.attemptId,
      idMessage: ID,
    })
    const result = await sending
    const cached = session.client.getQueryData(
      messageKey({ connectionScope: SCOPE, chatId: CHAT }),
    )
    if (disposition === 'grace') {
      expect(result?.kind).toBe(TEST_MESSAGE_PROTOCOL_ACCEPTED)
      expect(cached).toMatchObject({ messages: [{ idMessage: ID }] })
    } else {
      expect(result).toBeNull()
      expect(cached).toBeUndefined()
    }
    await session.close()
  })
}

test('unknown outcome is never retried automatically and a rejected manual retry preserves uncertainty', async () => {
  const session = createQuerySession({ connectionScope: SCOPE })
  let attempts = 0
  const controller = createSendController({
    session,
    canSend: () => true,
    captureOwnerContext: () => owner,
    isCurrentOwnerContext: () => true,
    dispatch: async () => {
      attempts += 1
      throw new SendMessageError({
        code: TEST_API_CODE_OUTCOME_UNKNOWN,
        status: null,
        outcome: attempts === 1 ? 'unknown' : 'not_sent',
      })
    },
  })
  const input = { target, text: TEXT, selectionEpoch: 1, editorRevision: 1 }
  expect(await controller.send(input)).toMatchObject({
    kind: TEST_API_RESPONSE_ERROR,
    outcome: 'unknown',
  })
  expect(attempts).toBe(1)
  expect(await controller.send(input)).toMatchObject({
    kind: TEST_API_RESPONSE_ERROR,
    outcome: 'unknown',
  })
  expect(attempts).toBe(2)
  expect(
    session.client.getQueryData(
      messageKey({ connectionScope: SCOPE, chatId: CHAT }),
    ),
  ).toBeUndefined()
  await session.close()
})
