import { applyNotification } from './apply-notification'
import { acquireBrowserTabLease } from './browser-tab-lease'
import {
  createNotificationTransport,
  waitForNotificationRetry,
} from './notification-transport'
import { createNotificationChatRefresh } from './refresh-notification-chats'
import { runNotificationCycle } from './run-notification-cycle'
import type {
  NotificationCyclePorts,
  NotificationPost,
} from './run-notification-cycle'
import type {
  ConnectionEvent,
  ConnectionState,
} from '@/features/conversation/notifications/model/connection-model'
import {
  initialConnectionModel,
  pendingAckToken,
  toConnectionState,
  transitionConnection,
} from '@/features/conversation/notifications/model/connection-model'
import type { OwnerContext } from '@/features/conversation/notifications/model/types'
import type { QuerySession } from '@/shared/query/create-query-session'
import { SessionQueryError } from '@/shared/query/session-query-error'
import {
  NOTIFICATION_CODE,
  NOTIFICATION_STATE,
  POLLING_CONFIG,
} from '@/features/conversation/notifications/model/constants'
import { API_ERROR_CODE } from '@/shared/kernel/api/constants'
import { HTTP_HEADERS, HTTP_STATUS } from '@/shared/kernel/http/constants'

const { OWNERSHIP_BUSY, NOT_CONFIGURED, INVALID_UPSTREAM } = NOTIFICATION_CODE
const { CONNECTION_SCOPE } = HTTP_HEADERS
const { SESSION_REQUIRED, CONNECTION_CHANGED } = API_ERROR_CODE
const { UNAUTHORIZED, CONFLICT } = HTTP_STATUS
const { CLOSED } = NOTIFICATION_STATE
const { LOCK_UNAVAILABLE } = POLLING_CONFIG

export type { ConnectionState } from '@/features/conversation/notifications/model/connection-model'

export const createNotificationConnection = ({
  session,
  fetcher = fetch,
  acquireLease = acquireBrowserTabLease,
  transport,
  wait = waitForNotificationRetry,
  random = Math.random,
  now = Date.now,
}: {
  session: QuerySession
  fetcher?: typeof fetch
  acquireLease?: typeof acquireBrowserTabLease
  transport?: NotificationPost
  wait?: NotificationCyclePorts['wait']
  random?: NotificationCyclePorts['random']
  now?: () => number
}) => {
  let model = initialConnectionModel
  let state: ConnectionState = toConnectionState(model)
  let owner: OwnerContext | null = null
  let releaseLease: (() => void) | null = null
  let runningTask: Promise<void> | null = null
  let abort: AbortController | null = null
  let retained = 0
  let disposal: ReturnType<typeof setTimeout> | undefined
  const listeners = new Set<() => void>()
  const recoveryListeners = new Set<() => void>()
  const refresh = createNotificationChatRefresh({ session, now })
  const post =
    transport ?? createNotificationTransport({ session, fetcher, now })
  const applyTransition = (event: ConnectionEvent) => {
    const result = transitionConnection(model, event)
    if (result.model === model) return
    model = result.model
    const next = toConnectionState(model)
    const changed =
      next.status !== state.status ||
      next.canSend !== state.canSend ||
      next.issue !== state.issue
    if (changed) {
      state = next
      listeners.forEach((listener) => listener())
    }
    if (result.commands.includes('publish_recovery'))
      recoveryListeners.forEach((listener) => listener())
  }
  const isClosed = () => model.status === CLOSED && model.terminal
  const currentOwner = (context: OwnerContext) =>
    !isClosed() &&
    session.isActive() &&
    owner !== null &&
    releaseLease !== null &&
    context.connectionScope === owner.connectionScope &&
    context.ownerEpoch === owner.ownerEpoch
  const captureOwnerContext = () =>
    owner && currentOwner(owner) ? { ...owner } : null
  const close = () => {
    if (isClosed()) return
    applyTransition({ type: 'close' })
    abort?.abort()
    clearTimeout(disposal)
    owner = null
    releaseLease?.()
    releaseLease = null
    refresh.close()
  }
  session.registerCleanup(close)
  const handleFailure = async (error: unknown) => {
    if (!(error instanceof SessionQueryError)) return false
    const auth =
      (error.code === SESSION_REQUIRED && error.status === UNAUTHORIZED) ||
      (error.code === CONNECTION_CHANGED && error.status === CONFLICT)
    if (auth) {
      await session.handleSessionError(error)
      return true
    }
    if (error.code === LOCK_UNAVAILABLE) {
      applyTransition({
        type: 'limited',
        generation: model.generation,
        issue: LOCK_UNAVAILABLE,
      })
      return true
    }
    const invalid =
      error.code === INVALID_UPSTREAM || error.code === NOT_CONFIGURED
    if (invalid) {
      applyTransition({
        type: 'paused',
        generation: model.generation,
        issue: error.code,
      })
      return true
    }
    return false
  }
  const run = async (attemptGeneration: number) => {
    abort = new AbortController()
    const signal = abort.signal
    const active = () =>
      !isClosed() &&
      session.isActive() &&
      model.generation === attemptGeneration &&
      !signal.aborted
    try {
      if (!releaseLease) {
        const lease = await acquireLease({
          connectionScope: session.connectionScope,
        })
        if (!active()) {
          lease?.()
          return
        }
        if (!lease) {
          applyTransition({
            type: 'limited',
            generation: attemptGeneration,
            issue: OWNERSHIP_BUSY,
          })
          return
        }
        releaseLease = lease
        owner = {
          connectionScope: session.connectionScope,
          ownerEpoch: crypto.randomUUID(),
        }
      }
      const runtimeOwner = owner
      if (!runtimeOwner) return
      await runNotificationCycle({
        generation: attemptGeneration,
        owner: runtimeOwner,
        signal,
        active,
        post,
        wait,
        random,
        pendingAck: () => pendingAckToken(model),
        transition: applyTransition,
        applyDelivery: (delivery) =>
          applyNotification({
            session,
            delivery,
            ownerEpoch: runtimeOwner.ownerEpoch,
            refreshChats: refresh.request,
          }),
        handleFailure,
      })
    } catch (error) {
      if (!active()) return
      if (await handleFailure(error)) return
      applyTransition({
        type: 'limited',
        generation: model.generation,
        issue: LOCK_UNAVAILABLE,
      })
    }
  }
  const start = () => {
    const available = !runningTask && !isClosed() && session.isActive()
    if (!available) return
    applyTransition({ type: 'start' })
    const task = run(model.generation)
    runningTask = task
    void task.finally(() => {
      if (runningTask === task) runningTask = null
    })
  }
  const retry = async () => {
    const unavailable = isClosed() || !session.isActive()
    if (unavailable) return
    applyTransition({ type: 'retry_requested' })
    const retryGeneration = model.generation
    abort?.abort()
    await runningTask
    if (model.generation === retryGeneration) start()
  }
  const retain = () => {
    retained += 1
    clearTimeout(disposal)
    start()
    return () => {
      retained -= 1
      if (retained === 0) disposal = setTimeout(close, 0)
    }
  }
  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }
  const subscribeRecovery = (listener: () => void) => {
    recoveryListeners.add(listener)
    return () => {
      recoveryListeners.delete(listener)
    }
  }
  return {
    retain,
    start,
    close,
    retry,
    subscribe,
    subscribeRecovery,
    getSnapshot: () => state,
    captureOwnerContext,
    isCurrentOwnerContext: currentOwner,
    getOwnedHeaders: () =>
      captureOwnerContext()
        ? { [CONNECTION_SCOPE]: session.connectionScope }
        : null,
  }
}
