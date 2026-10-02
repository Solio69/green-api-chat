import { randomBytes } from 'node:crypto'
import { setTimeout as wait } from 'node:timers/promises'
import { normalizeNotification } from './normalize-notification'
import type {
  StartReceiverOptions,
  ReceiverLoopAccess,
} from './receiver-registry'
import { ReceiverError } from './receiver-registry'
import type { NotificationDelivery, ReceiverProvider } from './types'
import { API_ERROR_CODE } from '@/lib/api/constants'
import {
  NOTIFICATION_CODE,
  NOTIFICATION_CONFIG,
  NOTIFICATION_EVENT,
  NOTIFICATION_STATE,
} from './constants'

const {
  RECEIVER_NOT_ACTIVE,
  RETRY_LATER,
  INVALID_UPSTREAM,
  DELETE_FAILED,
  NOT_CONFIGURED,
} = NOTIFICATION_CODE
const { STATE, NOTIFICATION, ERROR } = NOTIFICATION_EVENT
const { RETRYING, RECEIVING } = NOTIFICATION_STATE
const {
  IDENTIFIER_BYTES,
  IDENTIFIER_ENCODING,
  BACKOFF_JITTER_MIN,
  BACKOFF_JITTER_RANGE,
} = NOTIFICATION_CONFIG
const { SESSION_REQUIRED } = API_ERROR_CODE

const { REQUEST_SPACING_MS, MAX_DELETE_ATTEMPTS, BACKOFF_MS } =
  NOTIFICATION_CONFIG
type Pending = {
  receiptId: number
  delivery: NotificationDelivery
  processed: boolean
  attempts: number
  recovering: boolean
}
export const createReceiverLoop = ({
  context,
  ownerEpoch,
  active,
  emit,
  operation,
  pause,
  provider,
  sleep = (delay) => wait(delay),
}: StartReceiverOptions & {
  provider: ReceiverProvider
  sleep?: (delay: number) => Promise<void>
}): ReceiverLoopAccess => {
  let pending: Pending | null = null
  let busy = false
  let stopped = false
  let paused = false
  let failures = 0
  let retrying = false
  let rerun = false
  const abort = new AbortController()
  const healthy = () => !stopped && !paused && active()
  const fail = (code: string) => {
    paused = true
    pause(code)
  }
  const call = async <T>(callback: () => Promise<T>): Promise<T> => {
    await sleep(REQUEST_SPACING_MS)
    if (!healthy()) throw new ReceiverError({ code: RECEIVER_NOT_ACTIVE })
    operation(1)
    try {
      return await callback()
    } finally {
      operation(-1)
    }
  }
  const markRetrying = () => {
    retrying = true
    emit({
      event: STATE,
      data: {
        connectionScope: context.connectionScope,
        ownerEpoch,
        state: RETRYING,
        code: RETRY_LATER,
      },
    })
  }
  const publish = () => {
    if (!pending) return
    if (!healthy()) return
    emit({ event: NOTIFICATION, data: pending.delivery })
  }
  const readHead = async () => {
    const value = await call(() =>
      provider.receive({ context, signal: abort.signal }),
    )
    if (!healthy()) return
    if (retrying) {
      retrying = false
      failures = 0
      emit({
        event: STATE,
        data: {
          connectionScope: context.connectionScope,
          ownerEpoch,
          state: RECEIVING,
        },
      })
    }
    if (value === null) {
      pending = null
      return
    }
    const normalized = normalizeNotification({
      value,
      credentials: context.credentials,
    })
    if (!normalized) {
      fail(INVALID_UPSTREAM)
      return
    }
    const sameRecoveringHead =
      pending?.recovering && normalized.receiptId === pending.receiptId
    if (sameRecoveringHead && pending) {
      const unchanged =
        JSON.stringify(normalized.event) ===
        JSON.stringify(pending.delivery.event)
      if (!unchanged) {
        fail(INVALID_UPSTREAM)
        return
      }
      if (pending.attempts >= MAX_DELETE_ATTEMPTS) {
        fail(DELETE_FAILED)
        return
      }
      pending.recovering = false
      return
    }
    pending = {
      receiptId: normalized.receiptId,
      delivery: {
        connectionScope: context.connectionScope,
        ownerEpoch,
        deliveryId: randomBytes(IDENTIFIER_BYTES).toString(IDENTIFIER_ENCODING),
        event: normalized.event,
      },
      processed: false,
      attempts: 0,
      recovering: false,
    }
    publish()
  }
  const run = async () => {
    if (busy) {
      rerun = true
      return
    }
    busy = true
    try {
      while (healthy()) {
        try {
          const needsHead = !pending || pending.recovering
          if (needsHead) await readHead()
          if (!healthy()) break
          if (!pending) continue
          if (!pending.processed) break
          const current = pending
          current.attempts += 1
          let deleteRetryAfter = 0
          try {
            const deleted = await call(() =>
              provider.delete({
                context,
                receiptId: current.receiptId,
                signal: abort.signal,
              }),
            )
            if (deleted) {
              pending = null
              failures = 0
              continue
            }
          } catch (error) {
            if (error instanceof ReceiverError)
              deleteRetryAfter = error.retryAfterMs
            const authorizationFailed =
              error instanceof ReceiverError && error.code === SESSION_REQUIRED
            if (authorizationFailed) throw error
          }
          current.recovering = true
          markRetrying()
          const delay =
            BACKOFF_MS[Math.min(current.attempts - 1, BACKOFF_MS.length - 1)]
          await sleep(Math.max(delay, deleteRetryAfter))
        } catch (error) {
          if (!healthy()) break
          const code = error instanceof ReceiverError ? error.code : RETRY_LATER
          const terminal =
            code === SESSION_REQUIRED ||
            code === NOT_CONFIGURED ||
            code === INVALID_UPSTREAM
          if (terminal) {
            if (code === SESSION_REQUIRED)
              emit({
                event: ERROR,
                data: {
                  connectionScope: context.connectionScope,
                  ownerEpoch,
                  code,
                },
              })
            fail(code)
            break
          }
          markRetrying()
          const nominal =
            BACKOFF_MS[Math.min(failures++, BACKOFF_MS.length - 1)] *
            (BACKOFF_JITTER_MIN + Math.random() * BACKOFF_JITTER_RANGE)
          const retryAfter =
            error instanceof ReceiverError ? error.retryAfterMs : 0
          await sleep(Math.max(nominal, retryAfter))
        }
      }
    } finally {
      busy = false
      if (rerun) {
        rerun = false
        if (healthy()) void run()
      }
    }
  }
  const wake = () => {
    const awaitingAck = pending !== null && !pending.processed
    if (awaitingAck) publish()
    void run()
  }
  const ack = (deliveryId: string) => {
    const valid =
      healthy() &&
      pending !== null &&
      pending.delivery.deliveryId === deliveryId
    if (!valid) return false
    if (!pending) return false
    pending.processed = true
    void run()
    return true
  }
  const stop = () => {
    stopped = true
    abort.abort()
    pending = null
  }
  return { wake, ack, stop }
}
