import { describe, expect, it } from 'vitest'
import {
  initialConnectionModel,
  transitionConnection,
  toConnectionState,
  pendingAckToken,
} from '@/lib/notifications/connection-model'
import type {
  ConnectionEvent,
  ConnectionModel,
} from '@/lib/notifications/connection-model'

const step = (model: ConnectionModel, event: ConnectionEvent) =>
  transitionConnection(model, event).model
const connected = (outgoingEnabled = true) => {
  const started = step(initialConnectionModel, { type: 'start' })
  return transitionConnection(started, {
    type: 'settings_ready',
    generation: started.generation,
    outgoingEnabled,
  })
}

describe('notification connection model', () => {
  it('starts once, derives send availability and keeps outgoing status warning separate', () => {
    expect(toConnectionState(initialConnectionModel)).toEqual({
      status: 'closed',
      canSend: false,
      issue: null,
    })
    const started = step(initialConnectionModel, { type: 'start' })
    expect(toConnectionState(started)).toEqual({
      status: 'connecting',
      canSend: false,
      issue: null,
    })
    expect(step(started, { type: 'start' })).toBe(started)
    const first = transitionConnection(started, {
      type: 'settings_ready',
      generation: started.generation,
      outgoingEnabled: false,
    })
    expect(first.commands).toEqual([])
    expect(toConnectionState(first.model)).toEqual({
      status: 'connected',
      canSend: true,
      issue: 'outgoing_notifications_disabled',
    })
  })

  it('keeps an applied delivery pending through transient failure and clears proof only on ACK/expiry', () => {
    let model = connected().model
    model = step(model, {
      type: 'delivery_applied',
      generation: model.generation,
      token: 'fictional-proof',
    })
    expect(pendingAckToken(model)).toBe('fictional-proof')
    expect(toConnectionState(model).canSend).toBe(true)
    model = step(model, {
      type: 'temporary_failure',
      generation: model.generation,
    })
    expect(toConnectionState(model)).toEqual({
      status: 'retrying',
      canSend: false,
      issue: 'retry_later',
    })
    expect(pendingAckToken(model)).toBe('fictional-proof')
    model = step(model, {
      type: 'ack_expired',
      generation: model.generation,
    })
    expect(pendingAckToken(model)).toBeNull()
    model = step(model, {
      type: 'delivery_applied',
      generation: model.generation,
      token: 'second-proof',
    })
    model = step(model, {
      type: 'ack_confirmed',
      generation: model.generation,
      token: 'second-proof',
    })
    expect(pendingAckToken(model)).toBeNull()
  })

  it('emits recovery exactly once for each transition back from a failure', () => {
    let model = connected().model
    const generation = model.generation
    model = step(model, { type: 'temporary_failure', generation })
    const restored = transitionConnection(model, {
      type: 'cycle_succeeded',
      generation,
    })
    expect(restored.commands).toEqual(['publish_recovery'])
    expect(toConnectionState(restored.model).canSend).toBe(true)
    expect(
      transitionConnection(restored.model, {
        type: 'cycle_succeeded',
        generation,
      }).commands,
    ).toEqual([])
    model = step(restored.model, { type: 'temporary_failure', generation })
    expect(
      transitionConnection(model, { type: 'cycle_succeeded', generation })
        .commands,
    ).toEqual(['publish_recovery'])
  })

  it('derives limited and paused warnings, invalidates stale generation on manual retry', () => {
    const started = step(initialConnectionModel, { type: 'start' })
    const oldGeneration = started.generation
    const limited = step(started, {
      type: 'limited',
      generation: oldGeneration,
      issue: 'ownership_busy',
    })
    expect(toConnectionState(limited)).toEqual({
      status: 'limited',
      canSend: false,
      issue: 'ownership_busy',
    })
    const retried = step(limited, { type: 'retry_requested' })
    expect(retried.generation).toBe(oldGeneration + 1)
    expect(
      step(retried, {
        type: 'settings_ready',
        generation: oldGeneration,
        outgoingEnabled: true,
      }),
    ).toBe(retried)
    const restarted = step(retried, { type: 'start' })
    const paused = step(restarted, {
      type: 'paused',
      generation: restarted.generation,
      issue: 'invalid_upstream_response',
    })
    expect(toConnectionState(paused)).toEqual({
      status: 'paused',
      canSend: false,
      issue: 'invalid_upstream_response',
    })
  })

  it('makes close terminal and ignores late success or repeated start/retry', () => {
    const live = connected().model
    const oldGeneration = live.generation
    const closed = step(live, { type: 'close' })
    expect(closed.generation).toBe(oldGeneration + 1)
    expect(toConnectionState(closed)).toEqual({
      status: 'closed',
      canSend: false,
      issue: null,
    })
    expect(
      step(closed, {
        type: 'cycle_succeeded',
        generation: oldGeneration,
      }),
    ).toBe(closed)
    expect(step(closed, { type: 'start' })).toBe(closed)
    expect(step(closed, { type: 'retry_requested' })).toBe(closed)
    expect(step(closed, { type: 'close' })).toBe(closed)
  })
})

describe('additional transition boundaries', () => {
  it.each([
    {
      event: { type: 'limited', issue: 'browser_lock_unavailable' },
      status: 'limited',
    },
    {
      event: { type: 'paused', issue: 'notifications_not_configured' },
      status: 'paused',
    },
  ] as const)(
    'projects $event.issue without enabling send',
    ({ event, status }) => {
      const started = step(initialConnectionModel, { type: 'start' })
      const next = step(started, {
        ...event,
        generation: started.generation,
      })
      expect(toConnectionState(next)).toEqual({
        status,
        canSend: false,
        issue: event.issue,
      })
      expect(pendingAckToken(next)).toBeNull()
    },
  )

  it('ignores wrong ACK token and clears pending proof on manual retry', () => {
    let model = connected().model
    const oldGeneration = model.generation
    model = step(model, {
      type: 'delivery_applied',
      generation: oldGeneration,
      token: 'current-proof',
    })
    expect(
      step(model, {
        type: 'ack_confirmed',
        generation: oldGeneration,
        token: 'stale-proof',
      }),
    ).toBe(model)
    model = step(model, { type: 'retry_requested' })
    expect(pendingAckToken(model)).toBeNull()
    expect(
      step(model, { type: 'temporary_failure', generation: oldGeneration }),
    ).toBe(model)
    model = step(model, { type: 'start' })
    const restored = transitionConnection(model, {
      type: 'settings_ready',
      generation: model.generation,
      outgoingEnabled: true,
    })
    expect(restored.commands).toEqual(['publish_recovery'])
    expect(toConnectionState(restored.model).canSend).toBe(true)
  })
})
