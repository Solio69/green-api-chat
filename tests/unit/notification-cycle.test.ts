import { describe, expect, it, vi } from 'vitest'
import {
  initialConnectionModel,
  pendingAckToken,
  transitionConnection,
} from '@/lib/notifications/connection-model'
import type { ConnectionEvent } from '@/lib/notifications/connection-model'
import { NotificationTransportError } from '@/lib/notifications/notification-transport'
import {
  runNotificationCycle,
  type NotificationCyclePorts,
} from '@/lib/notifications/run-notification-cycle'
import { SessionQueryError } from '@/lib/query/session-query-error'
import { NOTIFICATION_ROUTES } from '@/lib/notifications/constants'

const { SETTINGS, RECEIVE, ACK } = NOTIFICATION_ROUTES
const owner = {
  connectionScope: 'fictional-scope',
  ownerEpoch: 'fictional-epoch',
}
const proof = 'fictional-proof'
const delivery = {
  ...owner,
  deliveryId: proof,
  event: { kind: 'ignored' as const, reason: 'out_of_scope' as const },
}

const setup = () => {
  let model = transitionConnection(initialConnectionModel, {
    type: 'start',
  }).model
  let active = true
  const calls: string[] = []
  const events: ConnectionEvent[] = []
  const delays: number[] = []
  const applied: string[] = []
  const controller = new AbortController()
  const ports: NotificationCyclePorts = {
    generation: model.generation,
    owner,
    signal: controller.signal,
    active: () => active,
    post: async ({ url }) => {
      calls.push(url)
      if (url === SETTINGS) return { outgoingEnabled: true }
      if (url === RECEIVE) return { delivery: null, ackToken: null }
      return { deliveryId: proof }
    },
    wait: async ({ delay }) => {
      delays.push(delay)
      active = false
    },
    random: () => 0,
    pendingAck: () => pendingAckToken(model),
    transition: (event) => {
      events.push(event)
      model = transitionConnection(model, event).model
    },
    applyDelivery: (value) => {
      applied.push(value.deliveryId)
      return true
    },
    handleFailure: async () => false,
  }
  return {
    ports,
    calls,
    events,
    delays,
    applied,
    stop: () => {
      active = false
      controller.abort()
    },
  }
}

describe('notification cycle with controlled ports', () => {
  it('applies a valid ignored delivery before ACK and never receives while proof is pending', async () => {
    const harness = setup()
    const ack = Promise.withResolvers<Record<string, unknown>>()
    const post = harness.ports.post
    harness.ports.post = async (request) => {
      if (request.url === RECEIVE) {
        harness.calls.push(RECEIVE)
        return { delivery, ackToken: proof }
      }
      if (request.url === ACK) {
        harness.calls.push(ACK)
        return ack.promise
      }
      return post(request)
    }
    const task = runNotificationCycle(harness.ports)
    await vi.waitFor(() => expect(harness.calls).toContain(ACK))
    expect(harness.calls.filter((call) => call === RECEIVE)).toHaveLength(1)
    expect(harness.applied).toEqual([proof])
    expect(harness.events.map((event) => event.type)).toContain(
      'delivery_applied',
    )
    ack.resolve({ deliveryId: proof })
    await task
    expect(harness.events.map((event) => event.type)).toContain('ack_confirmed')
  })

  it('retries lost ACK with the same proof and honors backoff before another receive', async () => {
    const harness = setup()
    let acks = 0
    const tokens: unknown[] = []
    const post = harness.ports.post
    harness.ports.post = async (request) => {
      if (request.url === RECEIVE) {
        harness.calls.push(RECEIVE)
        return { delivery, ackToken: proof }
      }
      if (request.url === ACK) {
        harness.calls.push(ACK)
        tokens.push((request.body as { ackToken: unknown }).ackToken)
        acks += 1
        if (acks === 1) throw new Error('fictional-network-loss')
        return { deliveryId: proof }
      }
      return post(request)
    }
    harness.ports.wait = async ({ delay }) => {
      harness.delays.push(delay)
      if (harness.delays.length === 2) harness.stop()
    }
    await runNotificationCycle(harness.ports)
    expect(tokens).toEqual([proof, proof])
    expect(harness.calls.filter((call) => call === RECEIVE)).toHaveLength(1)
    expect(harness.delays).toEqual([800, 100])
    expect(harness.events.map((event) => event.type)).toContain(
      'temporary_failure',
    )
  })

  it('uses Retry-After as the minimum delay and stops after abort', async () => {
    const harness = setup()
    const post = harness.ports.post
    harness.ports.post = async (request) => {
      if (request.url === RECEIVE) {
        harness.calls.push(RECEIVE)
        throw new NotificationTransportError({
          code: 'retry_later',
          status: 503,
          retryAfterMs: 2_500,
        })
      }
      return post(request)
    }
    await runNotificationCycle(harness.ports)
    expect(harness.delays).toEqual([2_500])
    expect(harness.events.map((event) => event.type)).toContain(
      'temporary_failure',
    )
    expect(harness.calls.filter((call) => call === RECEIVE)).toHaveLength(1)
  })

  it('expires an old ACK proof and receives again without applying twice', async () => {
    const harness = setup()
    let receives = 0
    const post = harness.ports.post
    harness.ports.post = async (request) => {
      if (request.url === RECEIVE) {
        harness.calls.push(RECEIVE)
        receives += 1
        return receives === 1
          ? { delivery, ackToken: proof }
          : { delivery: null, ackToken: null }
      }
      if (request.url === ACK) {
        harness.calls.push(ACK)
        throw new SessionQueryError({
          code: 'delivery_changed',
          status: 409,
        })
      }
      return post(request)
    }
    await runNotificationCycle(harness.ports)
    expect(receives).toBe(2)
    expect(harness.applied).toEqual([proof])
    expect(harness.events.map((event) => event.type)).toContain('ack_expired')
  })

  it('discards a late ACK response after close without reporting success', async () => {
    const harness = setup()
    const ack = Promise.withResolvers<Record<string, unknown>>()
    const post = harness.ports.post
    harness.ports.post = async (request) => {
      if (request.url === RECEIVE) {
        harness.calls.push(RECEIVE)
        return { delivery, ackToken: proof }
      }
      if (request.url === ACK) {
        harness.calls.push(ACK)
        return ack.promise
      }
      return post(request)
    }
    const task = runNotificationCycle(harness.ports)
    await vi.waitFor(() => expect(harness.calls).toContain(ACK))
    harness.stop()
    ack.resolve({ deliveryId: proof })
    await task
    expect(harness.applied).toEqual([proof])
    expect(harness.events.map((event) => event.type)).not.toContain(
      'ack_confirmed',
    )
    expect(harness.delays).toEqual([])
  })
  it('discards a late settings response after close before receive or model transition', async () => {
    const harness = setup()
    const settings = Promise.withResolvers<Record<string, unknown>>()
    harness.ports.post = async ({ url }) => {
      harness.calls.push(url)
      return settings.promise
    }
    const task = runNotificationCycle(harness.ports)
    await vi.waitFor(() => expect(harness.calls).toContain(SETTINGS))
    harness.stop()
    settings.resolve({ outgoingEnabled: true })
    await task
    expect(harness.calls).toEqual([SETTINGS])
    expect(harness.events).toEqual([])
  })
})
