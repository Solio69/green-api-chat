import { expect, test } from '@playwright/test'
import { CancelledError, QueryObserver } from '@tanstack/react-query'
import { fetchChats } from '@/lib/chats/fetch-chats'
import { ChatsQueryError } from '@/lib/chats/types'
import { createQuerySession } from '@/lib/query/create-query-session'
import { CHAT_FIXTURES } from '../chats/constants'

const { scopeA, scopeB, chat } = CHAT_FIXTURES
const response = (scope = scopeA) =>
  Response.json({ status: 'ok', connectionScope: scope, chats: [chat] })
const active = () => true
test('query: client binds scope/header/signal and returns safe DTO', async () => {
  const controller = new AbortController()
  const fetcher: typeof fetch = async (input, init) => {
    expect(input).toBe('/api/chats')
    expect(init).toMatchObject({
      cache: 'no-store',
      signal: controller.signal,
      headers: { 'X-Connection-Scope': scopeA },
    })
    return response()
  }
  expect(
    await fetchChats({
      connectionScope: scopeA,
      signal: controller.signal,
      isActive: active,
      fetcher,
    }),
  ).toEqual([chat])
})
test('query: rejects foreign scope and invalid public payload', async () => {
  const options = {
    connectionScope: scopeA,
    signal: new AbortController().signal,
    isActive: active,
  }
  await expect(
    fetchChats({ ...options, fetcher: async () => response(scopeB) }),
  ).rejects.toMatchObject({ code: 'connection_changed', status: 409 })
  await expect(
    fetchChats({
      ...options,
      fetcher: async () =>
        Response.json({ status: 'ok', connectionScope: scopeA, chats: [{}] }),
    }),
  ).rejects.toMatchObject({ code: 'invalid_upstream_response' })
  await expect(
    fetchChats({
      ...options,
      fetcher: async () =>
        Response.json({ status: 'error', code: 'raw-secret' }, { status: 503 }),
    }),
  ).rejects.toMatchObject({ code: 'invalid_upstream_response' })
})
test('query: normalized error and network failure', async () => {
  const options = {
    connectionScope: scopeA,
    signal: new AbortController().signal,
    isActive: active,
  }
  await expect(
    fetchChats({
      ...options,
      fetcher: async () =>
        Response.json(
          { status: 'error', code: 'rate_limited' },
          { status: 429 },
        ),
    }),
  ).rejects.toMatchObject({ code: 'rate_limited', status: 429 })
  await expect(
    fetchChats({
      ...options,
      fetcher: async () => {
        throw new Error('network-secret')
      },
    }),
  ).rejects.toMatchObject({ code: 'service_unavailable', status: null })
})
test('query: two observers share a request, fresh remount reuses data', async () => {
  const pending = Promise.withResolvers<Response>()
  let calls = 0
  const session = createQuerySession({
    connectionScope: scopeA,
    fetcher: async () => {
      calls += 1
      return pending.promise
    },
  })
  const first = new QueryObserver(session.client, session.options())
  const second = new QueryObserver(session.client, session.options())
  const stopFirst = first.subscribe(() => undefined)
  const stopSecond = second.subscribe(() => undefined)
  expect(calls).toBe(1)
  pending.resolve(response())
  await expect.poll(() => first.getCurrentResult().data).toEqual([chat])
  expect(second.getCurrentResult().data).toEqual([chat])
  stopFirst()
  stopSecond()
  const remount = new QueryObserver(session.client, session.options())
  const stop = remount.subscribe(() => undefined)
  expect(remount.getCurrentResult().data).toEqual([chat])
  expect(calls).toBe(1)
  stop()
  await session.close()
})
test('query: refresh failure retains confirmed data and manual retry recovers', async () => {
  let fails = false
  const session = createQuerySession({
    connectionScope: scopeA,
    fetcher: async () =>
      fails
        ? Response.json(
            { status: 'error', code: 'service_unavailable' },
            { status: 503 },
          )
        : response(),
  })
  const observer = new QueryObserver(session.client, session.options())
  const stop = observer.subscribe(() => undefined)
  await expect.poll(() => observer.getCurrentResult().data).toEqual([chat])
  fails = true
  await observer.refetch()
  expect(observer.getCurrentResult().data).toEqual([chat])
  expect(observer.getCurrentResult().error).toBeInstanceOf(ChatsQueryError)
  fails = false
  await observer.refetch()
  expect(observer.getCurrentResult().error).toBeNull()
  stop()
  await session.close()
})
test('query: close aborts and late promise cannot restore cache; new account independent', async () => {
  const pending = Promise.withResolvers<Response>()
  let signal: AbortSignal | null | undefined
  const session = createQuerySession({
    connectionScope: scopeA,
    fetcher: async (_input, init) => {
      signal = init?.signal
      return pending.promise
    },
  })
  const promise = session.client
    .fetchQuery(session.options())
    .catch((error: unknown) => error)
  await session.close()
  expect(session.isActive()).toBe(false)
  expect(signal?.aborted).toBe(true)
  pending.resolve(response())
  expect(await promise).toBeInstanceOf(CancelledError)
  expect(session.client.getQueryCache().getAll()).toHaveLength(0)
  const other = createQuerySession({
    connectionScope: scopeB,
    fetcher: async () => response(scopeB),
  })
  expect(other.client).not.toBe(session.client)
  expect(await other.client.fetchQuery(other.options())).toEqual([chat])
  await other.close()
})
test('query: explicit timing/event policy and closed loader guard', async () => {
  const session = createQuerySession({ connectionScope: scopeA })
  expect(session.options()).toMatchObject({
    queryKey: ['chats', scopeA],
    staleTime: 60000,
    gcTime: 300000,
    retry: false,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchInterval: false,
  })
  let calls = 0
  await expect(
    fetchChats({
      connectionScope: scopeA,
      signal: new AbortController().signal,
      isActive: () => false,
      fetcher: async () => {
        calls += 1
        return response()
      },
    }),
  ).rejects.toBeInstanceOf(CancelledError)
  expect(calls).toBe(0)
  await session.close()
})
test('query: two access errors retire context and notify exactly once', async () => {
  let transitions = 0
  const session = createQuerySession({
    connectionScope: scopeA,
    fetcher: async () =>
      Response.json(
        { status: 'error', code: 'session_required' },
        { status: 401 },
      ),
    onSessionError: () => {
      transitions += 1
    },
  })
  const observer = new QueryObserver(session.client, session.options())
  const stop = observer.subscribe(() => undefined)
  await expect.poll(() => transitions).toBe(1)
  expect(session.isActive()).toBe(false)
  stop()
  await session.close()
})

test('query: abort during JSON parsing rejects a late body', async () => {
  const body = Promise.withResolvers<unknown>()
  const controller = new AbortController()
  let reading = false
  const result = response()
  result.json = () => {
    reading = true
    return body.promise
  }
  const pending = fetchChats({
    connectionScope: scopeA,
    signal: controller.signal,
    isActive: active,
    fetcher: async () => result,
  }).catch((error: unknown) => error)
  await expect.poll(() => reading).toBe(true)
  controller.abort()
  body.resolve({ status: 'ok', connectionScope: scopeA, chats: [chat] })
  expect(await pending).toBeInstanceOf(CancelledError)
})
