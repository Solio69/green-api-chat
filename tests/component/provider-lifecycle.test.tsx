import { act, cleanup, renderHook } from '@testing-library/react'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { createLifecycleTransport } from '../support/provider-lifecycle'
import { acquireBrowserTabLease } from '@/lib/notifications/browser-tab-lease'
import type { NotificationDelivery } from '@/lib/notifications/types'
import { isNotificationDelivery } from '@/lib/notifications/validate-delivery'
import { createQuerySession } from '@/lib/query/create-query-session'
import { NOTIFICATION_ROUTES } from '@/lib/notifications/constants'
import { CHAT_FIXTURES } from '../chats/constants'
import { NotificationProvider } from '@/components/NotificationProvider'
import {
  useNotificationOwner,
  useNotificationConnection,
} from '@/components/NotificationProvider/context'
import {
  QueryProvider,
  useOptionalQuerySession,
} from '@/components/QueryProvider'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}))
vi.mock('@/lib/notifications/browser-tab-lease')
vi.mock('@/lib/query/create-query-session', { spy: true })

const { scopeA, scopeB } = CHAT_FIXTURES
const { ACK } = NOTIFICATION_ROUTES
const CACHE_KEY = ['lifecycle-sentinel']
const acquireLease = vi.mocked(acquireBrowserTabLease)
const sessions = () =>
  vi
    .mocked(createQuerySession)
    .mock.results.filter((result) => result.type === 'return')
    .map((result) => result.value)
const flush = () =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(0)
  })
let transport: ReturnType<typeof createLifecycleTransport>

const renderProviders = () => {
  let scope: string = scopeA
  const effects: string[] = []
  const view = renderHook(
    () => {
      const session = useOptionalQuerySession()
      const controller = useNotificationOwner()
      const connection = useNotificationConnection()
      useEffect(() => {
        effects.push('setup')
        return () => {
          effects.push('cleanup')
        }
      }, [session])
      if (!session) throw new Error('Missing test session')
      return { session, controller, connection }
    },
    {
      reactStrictMode: true,
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryProvider key={scope} connectionScope={scope}>
          <NotificationProvider>{children}</NotificationProvider>
        </QueryProvider>
      ),
    },
  )
  return {
    ...view,
    effects,
    switchScope: () => {
      scope = scopeB
      view.rerender()
    },
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  transport = createLifecycleTransport()
  vi.stubGlobal('fetch', transport.fetcher)
})
afterEach(async () => {
  cleanup()
  // Safety net after assertions, including failed tests: release every real session.
  await Promise.all(sessions().map((session) => session.close()))
  transport.finish()
  await flush()
})

test('root StrictMode replays effects and keeps one live reader through rerender', async () => {
  const release = vi.fn()
  acquireLease.mockResolvedValue(release)
  const view = renderProviders()
  await flush()
  const { session, controller } = view.result.current
  expect(view.effects).toEqual(['setup', 'cleanup', 'setup'])
  expect(view.result.current.connection.status).toBe('connected')
  expect(acquireLease).toHaveBeenCalledTimes(1)
  expect(transport.receives()).toHaveLength(1)
  expect(controller.captureOwnerContext()).toMatchObject({
    connectionScope: scopeA,
  })
  const observedQueries = session.client.getQueryCache().getAll()
  expect(observedQueries.some((query) => query.getObserversCount() > 0)).toBe(
    true,
  )
  session.client.setQueryData(CACHE_KEY, 'current data')
  view.rerender()
  await flush()
  expect(view.result.current.session).toBe(session)
  expect(view.result.current.controller).toBe(controller)
  expect(session.client.getQueryData(CACHE_KEY)).toBe('current data')
  expect(transport.receives()).toHaveLength(1)
  const abandoned = sessions().filter((candidate) => candidate !== session)
  expect(abandoned.length).toBeGreaterThan(0)
  for (const candidate of abandoned)
    expect(candidate.client.getQueryCache().getAll()).toEqual([])
  view.unmount()
  await flush()
  expect(session.isActive()).toBe(false)
  expect(
    observedQueries.every((query) => query.getObserversCount() === 0),
  ).toBe(true)
  expect(controller.captureOwnerContext()).toBeNull()
  expect(session.client.getQueryCache().getAll()).toEqual([])
  expect(release).toHaveBeenCalledTimes(1)
  expect(transport.receives()[0].signal?.aborted).toBe(true)
  expect(vi.getTimerCount()).toBe(0)
})

test('a new scope key closes the previous session and isolates its cache and owner', async () => {
  const releaseA = vi.fn()
  const releaseB = vi.fn()
  acquireLease.mockResolvedValueOnce(releaseA).mockResolvedValueOnce(releaseB)
  const view = renderProviders()
  await flush()
  const old = view.result.current
  old.session.client.setQueryData(CACHE_KEY, 'old account')
  view.switchScope()
  await flush()
  const current = view.result.current
  expect(current.session).not.toBe(old.session)
  expect(current.controller).not.toBe(old.controller)
  expect(current.session.connectionScope).toBe(scopeB)
  expect(current.session.client.getQueryData(CACHE_KEY)).toBeUndefined()
  expect(old.session.isActive()).toBe(false)
  expect(old.session.client.getQueryCache().getAll()).toEqual([])
  expect(old.controller.captureOwnerContext()).toBeNull()
  expect(current.controller.captureOwnerContext()).toMatchObject({
    connectionScope: scopeB,
  })
  expect(releaseA).toHaveBeenCalledTimes(1)
  expect(
    transport
      .receives()
      .map(({ scope, signal }) => ({ scope, aborted: signal?.aborted })),
  ).toEqual([
    { scope: scopeA, aborted: true },
    { scope: scopeB, aborted: false },
  ])
  view.unmount()
  await flush()
  expect(releaseB).toHaveBeenCalledTimes(1)
  expect(current.session.isActive()).toBe(false)
  expect(vi.getTimerCount()).toBe(0)
})

test('a receive resolved after unmount cannot restore cache or acknowledge delivery', async () => {
  const release = vi.fn()
  acquireLease.mockResolvedValue(release)
  const view = renderProviders()
  await flush()
  const { session, controller } = view.result.current
  const owner = controller.captureOwnerContext()
  const receive = transport.receives()[0]
  expect(owner).not.toBeNull()
  if (!owner) throw new Error('Missing mounted owner')
  view.unmount()
  await flush()
  expect(receive.signal?.aborted).toBe(true)
  await act(async () => {
    const delivery = {
      ...owner,
      deliveryId: 'late-delivery',
      event: {
        kind: 'incoming_message',
        chatId: 'chat-1',
        message: {
          idMessage: 'late-message',
          chatId: 'chat-1',
          text: 'Late',
          direction: 'incoming',
          timestamp: 1_800_000_000,
          status: null,
          kind: 'text',
          acceptedAt: null,
        },
        displayLabel: 'Late sender',
      },
    } satisfies NotificationDelivery
    expect(isNotificationDelivery(delivery)).toBe(true)
    receive.respond({ delivery, ackToken: delivery.deliveryId })
  })
  expect(session.isActive()).toBe(false)
  expect(session.client.getQueryCache().getAll()).toEqual([])
  expect(controller.captureOwnerContext()).toBeNull()
  expect(transport.requests.filter(({ url }) => url === ACK)).toEqual([])
  expect(release).toHaveBeenCalledTimes(1)
  expect(vi.getTimerCount()).toBe(0)
})

test('a lease acquired after unmount is released without starting transport', async () => {
  const pending = Promise.withResolvers<(() => void) | null>()
  const release = vi.fn()
  acquireLease.mockReturnValue(pending.promise)
  const view = renderProviders()
  await flush()
  view.unmount()
  await flush()
  await act(async () => {
    pending.resolve(release)
  })
  expect(release).toHaveBeenCalledTimes(1)
  expect(transport.fetcher).not.toHaveBeenCalled()
  expect(view.result.current.session.isActive()).toBe(false)
  expect(view.result.current.controller.captureOwnerContext()).toBeNull()
  expect(vi.getTimerCount()).toBe(0)
})

test('a failed lease setup leaves no owner, requests or timers after unmount', async () => {
  acquireLease.mockRejectedValue(new Error('Fictional lock failure'))
  const view = renderProviders()
  await flush()
  expect(view.result.current.connection).toMatchObject({
    status: 'limited',
    canSend: false,
  })
  expect(view.result.current.controller.captureOwnerContext()).toBeNull()
  expect(transport.fetcher).not.toHaveBeenCalled()
  view.unmount()
  await flush()
  expect(view.result.current.session.isActive()).toBe(false)
  expect(vi.getTimerCount()).toBe(0)
})

test('one failing cleanup does not prevent the remaining resources from closing', async () => {
  const release = vi.fn()
  acquireLease.mockResolvedValue(release)
  const view = renderProviders()
  await flush()
  const { session, controller } = view.result.current
  const cleanupAfterFailure = vi.fn()
  session.registerCleanup(() => {
    throw new Error('Fictional cleanup failure')
  })
  session.registerCleanup(cleanupAfterFailure)
  session.client.setQueryData(CACHE_KEY, 'to be cleared')
  view.unmount()
  await flush()
  expect(cleanupAfterFailure).toHaveBeenCalledTimes(1)
  expect(session.client.getQueryCache().getAll()).toEqual([])
  expect(controller.captureOwnerContext()).toBeNull()
  expect(release).toHaveBeenCalledTimes(1)
  expect(transport.receives()[0].signal?.aborted).toBe(true)
  expect(vi.getTimerCount()).toBe(0)
})

test.each([
  { status: 'connected', reply: { delivery: null, ackToken: null } },
  { status: 'retrying', reply: { status: 'error', code: 'retry_later' } },
])('unmount cancels the $status loop timer', async ({ status, reply }) => {
  const release = vi.fn()
  acquireLease.mockResolvedValue(release)
  const view = renderProviders()
  await flush()
  await act(async () => {
    transport.receives()[0].respond(reply)
  })
  expect(view.result.current.connection.status).toBe(status)
  expect(vi.getTimerCount()).toBeGreaterThan(0)
  view.unmount()
  await flush()
  expect(vi.getTimerCount()).toBe(0)
  await act(async () => {
    await vi.advanceTimersByTimeAsync(30_000)
  })
  expect(transport.receives()).toHaveLength(1)
  expect(release).toHaveBeenCalledTimes(1)
})
