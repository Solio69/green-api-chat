import { CancelledError } from '@tanstack/react-query'
import { expect, test } from 'vitest'
import { createConnectionSession } from '@/features/conversation/application/create-connection-session'
import { fetchHistory } from '@/features/conversation/history/application/fetch-history'
import { HistoryQueryError } from '@/features/conversation/history/application/history-query-error'
import { applyHistoryMessages } from '@/features/conversation/messages/application/message-cache'
import { mergeMessageFacts } from '@/features/conversation/messages/model/merge-message-facts'
import type { MessageDTO } from '@/features/conversation/messages/model/types'
import { HISTORY_TEST } from '../history/constants'

const {
  API,
  METHOD,
  CONTENT_TYPE,
  NO_STORE,
  SCOPE_HEADER,
  SUCCESS,
  ERROR,
  scopeA,
  scopeB,
  chatA,
  chatB,
  message,
  MESSAGES_KEY,
  STATUS,
  CODE,
  CLEANUP_ORDER,
  HTTP,
  NETWORK_ERROR,
  OLD_MESSAGE_ID,
  RECENT_MESSAGE_ID,
  MESSAGE,
} = HISTORY_TEST
const reply = (messages: MessageDTO[] = [message]) =>
  Response.json({
    status: SUCCESS,
    connectionScope: scopeA,
    chatId: chatA,
    messages,
  })
const active = () => true
const options = () => ({
  connectionScope: scopeA,
  chatId: chatA,
  signal: new AbortController().signal,
  isActive: active,
})
test('history fetch posts only chatId and guards the public normalized response', async () => {
  const input = options()
  const result = await fetchHistory({
    ...input,
    fetcher: async (url, init) => {
      expect(url).toBe(API)
      expect(init).toMatchObject({
        method: METHOD,
        cache: NO_STORE,
        credentials: HTTP.CREDENTIALS,
        headers: {
          [SCOPE_HEADER]: scopeA,
          [HTTP.CONTENT_TYPE]: CONTENT_TYPE,
        },
        signal: input.signal,
      })
      expect(JSON.parse(String(init?.body))).toEqual({ chatId: chatA })
      return reply()
    },
  })
  expect(result).toEqual([message])
})
test('history fetch accepts empty and rejects foreign or invalid normalized data', async () => {
  expect(
    await fetchHistory({ ...options(), fetcher: async () => reply([]) }),
  ).toEqual([])
  const cases = [
    { connectionScope: scopeB },
    { chatId: chatB },
    { messages: [{ ...message, timestamp: null }] },
    { messages: [{ ...message, kind: MESSAGE.TEXT, text: null }] },
    { messages: [{ ...message, direction: 'bad' }] },
  ]
  for (const overrides of cases) {
    await expect(
      fetchHistory({
        ...options(),
        fetcher: async () =>
          Response.json({
            status: SUCCESS,
            connectionScope: scopeA,
            chatId: chatA,
            messages: [message],
            ...overrides,
          }),
      }),
    ).rejects.toBeInstanceOf(HistoryQueryError)
  }
})
test('history fetch normalized HTTP errors and network failure remain distinct from empty success', async () => {
  for (const [code, status] of [
    [CODE.SESSION, STATUS.UNAUTHORIZED],
    [CODE.CHANGED, STATUS.CONFLICT],
    [CODE.INVALID, STATUS.FORBIDDEN],
    [CODE.RATE_LIMITED, STATUS.RATE_LIMITED],
  ] as const) {
    await expect(
      fetchHistory({
        ...options(),
        fetcher: async () => Response.json({ status: ERROR, code }, { status }),
      }),
    ).rejects.toMatchObject({ code, status })
  }
  await expect(
    fetchHistory({
      ...options(),
      fetcher: async () => {
        throw new Error(NETWORK_ERROR)
      },
    }),
  ).rejects.toMatchObject({ code: CODE.UNAVAILABLE, status: null })
})
test('history fetch guards closed scope before fetch and after asynchronous JSON', async () => {
  let calls = 0
  await expect(
    fetchHistory({
      ...options(),
      isActive: () => false,
      fetcher: async () => {
        calls += 1
        return reply()
      },
    }),
  ).rejects.toBeInstanceOf(CancelledError)
  expect(calls).toBe(0)
  const body = Promise.withResolvers<unknown>()
  const response = reply()
  response.json = () => body.promise
  const controller = new AbortController()
  const pending = fetchHistory({
    ...options(),
    signal: controller.signal,
    fetcher: async () => response,
  }).catch((error: unknown) => error)
  controller.abort()
  body.resolve({
    status: SUCCESS,
    connectionScope: scopeA,
    chatId: chatA,
    messages: [message],
  })
  expect(await pending).toBeInstanceOf(CancelledError)
})
test('history merge retains messages missing from latest ten and distinguishes equal text with different ids', () => {
  const old = {
    ...message,
    idMessage: OLD_MESSAGE_ID,
    timestamp: 10,
  }
  const recent = {
    ...message,
    idMessage: RECENT_MESSAGE_ID,
    timestamp: 200,
  }
  const current = [old, message]
  const result = mergeMessageFacts({ current, messages: [message, recent] })
  expect(result.messages).toEqual([old, message, recent])
  expect(result.issues).toEqual([])
  expect(
    mergeMessageFacts({ current: result.messages, messages: [] }).messages,
  ).toEqual(result.messages)
  expect(result.messages).not.toBe(current)
  expect(current).toEqual([old, message])
})
test('history merge does not downgrade confirmed status or replace known text with null', () => {
  const confirmed: MessageDTO = {
    ...message,
    direction: MESSAGE.OUTGOING,
    status: MESSAGE.READ,
  }
  const later: MessageDTO = {
    ...confirmed,
    status: MESSAGE.DELIVERED,
    kind: MESSAGE.UNSUPPORTED,
    text: null,
  }
  expect(
    mergeMessageFacts({ current: [confirmed], messages: [later] }).messages,
  ).toEqual([confirmed])
  const failed: MessageDTO = {
    ...confirmed,
    status: MESSAGE.FAILED,
  }
  const result = mergeMessageFacts({ current: [confirmed], messages: [failed] })
  expect(result.messages).toEqual([confirmed])
  expect(result.issues).toEqual([
    {
      chatId: chatA,
      idMessage: message.idMessage,
      code: MESSAGE.FAILED,
    },
  ])
})
test('history cache is retained independently of request observers and is cleared by session close', async () => {
  const session = createConnectionSession({ connectionScope: scopeA })
  applyHistoryMessages({ session, chatId: chatA, messages: [message] })
  const key = [MESSAGES_KEY, scopeA, chatA]
  expect(session.client.getQueryData(key)).toEqual({ messages: [message] })
  expect(session.client.getQueryDefaults([MESSAGES_KEY])).toMatchObject({
    gcTime: Infinity,
    enabled: false,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  })
  applyHistoryMessages({ session, chatId: chatA, messages: [] })
  expect(session.client.getQueryData(key)).toEqual({ messages: [message] })
  expect(() =>
    applyHistoryMessages({
      session,
      chatId: chatA,
      messages: [{ ...message, chatId: chatB }],
    }),
  ).toThrow()
  await session.close()
  applyHistoryMessages({ session, chatId: chatA, messages: [message] })
  expect(session.client.getQueryCache().getAll()).toHaveLength(0)
})
test('history and chats share one normalized session transition and isolated cleanup errors', async () => {
  const session = createConnectionSession({ connectionScope: scopeA })
  const extension = session as typeof session & {
    connectionScope?: string
    registerCleanup?: (callback: () => void) => () => void
    handleSessionError?: (error: HistoryQueryError) => Promise<void>
  }
  expect(extension.connectionScope).toBe(scopeA)
  expect(typeof extension.registerCleanup).toBe('function')
  expect(typeof extension.handleSessionError).toBe('function')
  if (!extension.registerCleanup || !extension.handleSessionError) return
  const order: string[] = []
  extension.registerCleanup(() => {
    expect(session.isActive()).toBe(false)
    order.push(CLEANUP_ORDER.FIRST)
    throw new Error('fictional cleanup failure')
  })
  extension.registerCleanup(() => {
    order.push(CLEANUP_ORDER.SECOND)
  })
  session.subscribe(() => {
    order.push(CLEANUP_ORDER.SUBSCRIBER)
  })
  await extension.handleSessionError(
    new HistoryQueryError({ code: CODE.SESSION, status: STATUS.UNAUTHORIZED }),
  )
  expect(order).toEqual([
    CLEANUP_ORDER.FIRST,
    CLEANUP_ORDER.SECOND,
    CLEANUP_ORDER.SUBSCRIBER,
  ])
  let late = false
  extension.registerCleanup(() => {
    late = true
  })
  expect(late).toBe(true)
})
test('history normalized 409 alone cannot retire a session without matching connection code and status', async () => {
  let transitions = 0
  const session = createConnectionSession({
    connectionScope: scopeA,
    onSessionError: () => {
      transitions += 1
    },
  })
  const handler = (
    session as typeof session & {
      handleSessionError?: (error: HistoryQueryError) => Promise<void>
    }
  ).handleSessionError
  expect(typeof handler).toBe('function')
  if (!handler) return
  await handler(
    new HistoryQueryError({ code: CODE.CHANGED, status: STATUS.UNAVAILABLE }),
  )
  expect(session.isActive()).toBe(true)
  await Promise.all([
    handler(
      new HistoryQueryError({ code: CODE.CHANGED, status: STATUS.CONFLICT }),
    ),
    handler(
      new HistoryQueryError({
        code: CODE.SESSION,
        status: STATUS.UNAUTHORIZED,
      }),
    ),
  ])
  expect(session.isActive()).toBe(false)
  expect(transitions).toBe(1)
})
