import { NotificationTransportError } from './notification-transport'
import type { ConnectionEvent } from '@/features/conversation/notifications/model/connection-model'
import type {
  NotificationDelivery,
  OwnerContext,
} from '@/features/conversation/notifications/model/types'
import { isNotificationDelivery } from '@/features/conversation/notifications/model/validate-delivery'
import { SessionQueryError } from '@/shared/query/session-query-error'
import {
  NOTIFICATION_CODE,
  NOTIFICATION_CONFIG,
  NOTIFICATION_ROUTES,
  POLLING_CONFIG,
} from '@/features/conversation/notifications/model/constants'

const { INVALID_UPSTREAM, DELIVERY_CHANGED } = NOTIFICATION_CODE
const { SETTINGS, RECEIVE, ACK } = NOTIFICATION_ROUTES
const { BACKOFF_MS, BACKOFF_JITTER_MIN, BACKOFF_JITTER_RANGE } =
  NOTIFICATION_CONFIG
const { REQUEST_SPACING_MS } = POLLING_CONFIG

export type NotificationPost = (request: {
  url: string
  body: object
  signal: AbortSignal
}) => Promise<Record<string, unknown>>

export type NotificationCyclePorts = {
  generation: number
  owner: OwnerContext
  signal: AbortSignal
  active: () => boolean
  post: NotificationPost
  wait: (options: { delay: number; signal: AbortSignal }) => Promise<void>
  random: () => number
  pendingAck: () => string | null
  transition: (event: ConnectionEvent) => void
  applyDelivery: (delivery: NotificationDelivery) => boolean
  handleFailure: (error: unknown) => Promise<boolean>
}

const invalidFrame = () =>
  new SessionQueryError({ code: INVALID_UPSTREAM, status: null })

export const runNotificationCycle = async ({
  generation,
  owner,
  signal,
  active,
  post,
  wait,
  random,
  pendingAck,
  transition,
  applyDelivery,
  handleFailure,
}: NotificationCyclePorts): Promise<void> => {
  let settingsReady = false
  let failures = 0
  while (active()) {
    try {
      if (!settingsReady) {
        const settings = await post({ url: SETTINGS, body: {}, signal })
        if (!active()) return
        if (typeof settings.outgoingEnabled !== 'boolean') throw invalidFrame()
        settingsReady = true
        transition({
          type: 'settings_ready',
          generation,
          outgoingEnabled: settings.outgoingEnabled,
        })
        if (!active()) return
      }
      if (pendingAck() === null) {
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
          if (!applyDelivery(value.delivery)) throw invalidFrame()
          if (!active()) return
          transition({
            type: 'delivery_applied',
            generation,
            token: value.delivery.deliveryId,
          })
        } else if (value.ackToken !== null) throw invalidFrame()
      }
      if (!active()) return
      const token = pendingAck()
      if (token !== null) {
        const response = await post({
          url: ACK,
          body: { ackToken: token },
          signal,
        })
        if (!active()) return
        if (response.deliveryId !== token) throw invalidFrame()
        transition({ type: 'ack_confirmed', generation, token })
      }
      if (!active()) return
      failures = 0
      transition({ type: 'cycle_succeeded', generation })
      await wait({ delay: REQUEST_SPACING_MS, signal })
    } catch (error) {
      if (!active()) return
      const expiredAck =
        error instanceof SessionQueryError &&
        error.code === DELIVERY_CHANGED &&
        pendingAck() !== null
      if (expiredAck) {
        transition({ type: 'ack_expired', generation })
        continue
      }
      if (await handleFailure(error)) return
      if (!active()) return
      transition({ type: 'temporary_failure', generation })
      const retryAfter =
        error instanceof NotificationTransportError ? error.retryAfterMs : 0
      const delay =
        BACKOFF_MS[Math.min(failures++, BACKOFF_MS.length - 1)] *
        (BACKOFF_JITTER_MIN + random() * BACKOFF_JITTER_RANGE)
      await wait({ delay: Math.max(delay, retryAfter), signal })
    }
  }
}
