import { applyNotification } from './apply-notification'
import { acquireBrowserTabLease } from './browser-tab-lease'
import {
  initialConnectionModel,
  pendingAckToken,
  toConnectionState,
  transitionConnection,
} from './connection-model'
import type { ConnectionEvent, ConnectionState } from './connection-model'
import {
  createNotificationTransport,
  NotificationTransportError,
  waitForNotificationRetry,
} from './notification-transport'
import { createNotificationChatRefresh } from './refresh-notification-chats'
import type { OwnerContext } from './types'
import { isNotificationDelivery } from './validate-delivery'
import type { QuerySession } from '@/lib/query/create-query-session'
import { SessionQueryError } from '@/lib/query/session-query-error'
import { API_ERROR_CODE } from '@/lib/api/constants'
import { HTTP_HEADERS, HTTP_STATUS } from '@/lib/http/constants'
import {
  NOTIFICATION_CODE,
  NOTIFICATION_CONFIG,
  NOTIFICATION_ROUTES,
  NOTIFICATION_STATE,
  POLLING_CONFIG,
} from './constants'

const { INVALID_UPSTREAM, OWNERSHIP_BUSY, NOT_CONFIGURED, DELIVERY_CHANGED } =
  NOTIFICATION_CODE
const { CONNECTION_SCOPE } = HTTP_HEADERS
const { SESSION_REQUIRED, CONNECTION_CHANGED } = API_ERROR_CODE
const { UNAUTHORIZED, CONFLICT } = HTTP_STATUS
const { CLOSED } = NOTIFICATION_STATE
const { SETTINGS, RECEIVE, ACK } = NOTIFICATION_ROUTES
const { BACKOFF_MS, BACKOFF_JITTER_MIN, BACKOFF_JITTER_RANGE } =
  NOTIFICATION_CONFIG
const { REQUEST_SPACING_MS, LOCK_UNAVAILABLE } = POLLING_CONFIG
export type { ConnectionState } from './connection-model'
const invalidFrame = () =>
  new SessionQueryError({ code: INVALID_UPSTREAM, status: null })
export const createNotificationConnection = ({
  session,
  fetcher = fetch,
  acquireLease = acquireBrowserTabLease,
}: {
  session: QuerySession
  fetcher?: typeof fetch
  acquireLease?: typeof acquireBrowserTabLease
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
  const refresh = createNotificationChatRefresh(session)
  const post = createNotificationTransport({ session, fetcher })
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
  const currentOwner = (context: OwnerContext) => {
    const current =
      !isClosed() &&
      session.isActive() &&
      owner !== null &&
      releaseLease !== null &&
      context.connectionScope === owner.connectionScope &&
      context.ownerEpoch === owner.ownerEpoch
    return current
  }
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
    let settingsReady = false
    let failures = 0
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
      while (active()) {
        try {
          if (!settingsReady) {
            const settings = await post({ url: SETTINGS, body: {}, signal })
            if (!active()) return
            if (typeof settings.outgoingEnabled !== 'boolean')
              throw invalidFrame()
            settingsReady = true
            applyTransition({
              type: 'settings_ready',
              generation: attemptGeneration,
              outgoingEnabled: settings.outgoingEnabled,
            })
          }
          if (pendingAckToken(model) === null) {
            if (!owner) return
            const value = await post({
              url: RECEIVE,
              body: { ownerEpoch: owner.ownerEpoch },
              signal,
            })
            if (!active()) return
            if (value.delivery !== null) {
              if (!isNotificationDelivery(value.delivery)) throw invalidFrame()
              const validProof =
                typeof value.ackToken === 'string' &&
                value.ackToken === value.delivery.deliveryId
              if (!validProof) throw invalidFrame()
              const applied = applyNotification({
                session,
                delivery: value.delivery,
                ownerEpoch: owner.ownerEpoch,
                refreshChats: refresh.request,
              })
              if (!applied) throw invalidFrame()
              applyTransition({
                type: 'delivery_applied',
                generation: attemptGeneration,
                token: value.delivery.deliveryId,
              })
            } else if (value.ackToken !== null) throw invalidFrame()
          }
          const pendingAck = pendingAckToken(model)
          if (pendingAck !== null) {
            const response = await post({
              url: ACK,
              body: { ackToken: pendingAck },
              signal,
            })
            if (!active()) return
            if (response.deliveryId !== pendingAck) throw invalidFrame()
            applyTransition({
              type: 'ack_confirmed',
              generation: attemptGeneration,
              token: pendingAck,
            })
          }
          failures = 0
          applyTransition({
            type: 'cycle_succeeded',
            generation: attemptGeneration,
          })
          await waitForNotificationRetry({ delay: REQUEST_SPACING_MS, signal })
        } catch (error) {
          if (!active()) return
          const expiredAck =
            error instanceof SessionQueryError &&
            error.code === DELIVERY_CHANGED &&
            pendingAckToken(model) !== null
          if (expiredAck) {
            applyTransition({
              type: 'ack_expired',
              generation: attemptGeneration,
            })
            continue
          }
          if (await handleFailure(error)) return
          applyTransition({
            type: 'temporary_failure',
            generation: attemptGeneration,
          })
          const retryAfter =
            error instanceof NotificationTransportError ? error.retryAfterMs : 0
          const delay =
            BACKOFF_MS[Math.min(failures++, BACKOFF_MS.length - 1)] *
            (BACKOFF_JITTER_MIN + Math.random() * BACKOFF_JITTER_RANGE)
          await waitForNotificationRetry({
            delay: Math.max(delay, retryAfter),
            signal,
          })
        }
      }
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
