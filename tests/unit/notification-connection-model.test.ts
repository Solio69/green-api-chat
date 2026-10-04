import { describe, expect, it } from 'vitest'
import {
  initialConnectionModel,
  transitionConnection,
  toConnectionState,
  pendingAckToken,
} from '@/features/conversation/notifications/model/connection-model'
import type {
  ConnectionEvent,
  ConnectionModel,
} from '@/features/conversation/notifications/model/connection-model'
import { NOTIFICATION_CONNECTION_TEST } from '../notifications/constants'

const {
  CLOSED,
  CONNECTING,
  CONNECTED,
  RETRYING,
  LIMITED,
  PAUSED,
  OWNERSHIP_BUSY,
  LOCK_UNAVAILABLE,
  INVALID_UPSTREAM,
  NOT_CONFIGURED,
  OUTGOING_DISABLED,
  RETRY_LATER,
} = NOTIFICATION_CONNECTION_TEST

const step = ({
  model,
  event,
}: {
  model: ConnectionModel
  event: ConnectionEvent
}) => transitionConnection(model, event).model
const connected = (outgoingEnabled = true) => {
  const started = step({
    model: initialConnectionModel,
    event: { type: 'start' },
  })
  return transitionConnection(started, {
    type: 'settings_ready',
    generation: started.generation,
    outgoingEnabled,
  })
}

describe('notification connection model', () => {
  it('starts once, derives send availability and keeps outgoing status warning separate', () => {
    expect(toConnectionState(initialConnectionModel)).toEqual({
      status: CLOSED,
      canSend: false,
      issue: null,
    })
    const started = step({
      model: initialConnectionModel,
      event: { type: 'start' },
    })
    expect(toConnectionState(started)).toEqual({
      status: CONNECTING,
      canSend: false,
      issue: null,
    })
    expect(step({ model: started, event: { type: 'start' } })).toBe(started)
    const first = transitionConnection(started, {
      type: 'settings_ready',
      generation: started.generation,
      outgoingEnabled: false,
    })
    expect(first.commands).toEqual([])
    expect(toConnectionState(first.model)).toEqual({
      status: CONNECTED,
      canSend: true,
      issue: OUTGOING_DISABLED,
    })
  })

  it('keeps an applied delivery pending through transient failure and clears proof only on ACK/expiry', () => {
    const pendingProof = 'fictional-proof'
    const renewedProof = 'second-proof'
    let model = connected().model
    model = step({
      model,
      event: {
        type: 'delivery_applied',
        generation: model.generation,
        token: pendingProof,
      },
    })
    expect(pendingAckToken(model)).toBe(pendingProof)
    expect(toConnectionState(model).canSend).toBe(true)
    model = step({
      model,
      event: { type: 'temporary_failure', generation: model.generation },
    })
    expect(toConnectionState(model)).toEqual({
      status: RETRYING,
      canSend: true,
      issue: RETRY_LATER,
    })
    expect(pendingAckToken(model)).toBe(pendingProof)
    model = step({
      model,
      event: { type: 'ack_expired', generation: model.generation },
    })
    expect(pendingAckToken(model)).toBeNull()
    model = step({
      model,
      event: {
        type: 'delivery_applied',
        generation: model.generation,
        token: renewedProof,
      },
    })
    model = step({
      model,
      event: {
        type: 'ack_confirmed',
        generation: model.generation,
        token: renewedProof,
      },
    })
    expect(pendingAckToken(model)).toBeNull()
  })

  it('emits recovery exactly once for each transition back from a failure', () => {
    let model = connected().model
    const generation = model.generation
    model = step({ model, event: { type: 'temporary_failure', generation } })
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
    model = step({
      model: restored.model,
      event: { type: 'temporary_failure', generation },
    })
    expect(
      transitionConnection(model, { type: 'cycle_succeeded', generation })
        .commands,
    ).toEqual(['publish_recovery'])
  })

  it('keeps sending unavailable until the first successful connection', () => {
    const started = step({
      model: initialConnectionModel,
      event: { type: 'start' },
    })
    const retrying = step({
      model: started,
      event: { type: 'temporary_failure', generation: started.generation },
    })
    expect(toConnectionState(retrying)).toEqual({
      status: RETRYING,
      canSend: false,
      issue: RETRY_LATER,
    })
    const restored = step({
      model: retrying,
      event: {
        type: 'settings_ready',
        generation: retrying.generation,
        outgoingEnabled: true,
      },
    })
    expect(toConnectionState(restored).canSend).toBe(true)
  })

  it('keeps restricted and closed connections unable to send after previous success', () => {
    const live = connected().model
    const limited = step({
      model: live,
      event: {
        type: LIMITED,
        generation: live.generation,
        issue: OWNERSHIP_BUSY,
      },
    })
    const paused = step({
      model: live,
      event: {
        type: PAUSED,
        generation: live.generation,
        issue: NOT_CONFIGURED,
      },
    })
    const closed = step({ model: live, event: { type: 'close' } })
    for (const model of [limited, paused, closed])
      expect(toConnectionState(model).canSend).toBe(false)
  })

  it('derives limited and paused warnings, invalidates stale generation on manual retry', () => {
    const started = step({
      model: initialConnectionModel,
      event: { type: 'start' },
    })
    const oldGeneration = started.generation
    const limited = step({
      model: started,
      event: {
        type: LIMITED,
        generation: oldGeneration,
        issue: OWNERSHIP_BUSY,
      },
    })
    expect(toConnectionState(limited)).toEqual({
      status: LIMITED,
      canSend: false,
      issue: OWNERSHIP_BUSY,
    })
    const retried = step({ model: limited, event: { type: 'retry_requested' } })
    expect(retried.generation).toBe(oldGeneration + 1)
    expect(
      step({
        model: retried,
        event: {
          type: 'settings_ready',
          generation: oldGeneration,
          outgoingEnabled: true,
        },
      }),
    ).toBe(retried)
    const restarted = step({ model: retried, event: { type: 'start' } })
    const paused = step({
      model: restarted,
      event: {
        type: PAUSED,
        generation: restarted.generation,
        issue: INVALID_UPSTREAM,
      },
    })
    expect(toConnectionState(paused)).toEqual({
      status: PAUSED,
      canSend: false,
      issue: INVALID_UPSTREAM,
    })
  })

  it('makes close terminal and ignores late success or repeated start/retry', () => {
    const live = connected().model
    const oldGeneration = live.generation
    const closed = step({ model: live, event: { type: 'close' } })
    expect(closed.generation).toBe(oldGeneration + 1)
    expect(toConnectionState(closed)).toEqual({
      status: CLOSED,
      canSend: false,
      issue: null,
    })
    expect(
      step({
        model: closed,
        event: { type: 'cycle_succeeded', generation: oldGeneration },
      }),
    ).toBe(closed)
    expect(step({ model: closed, event: { type: 'start' } })).toBe(closed)
    expect(step({ model: closed, event: { type: 'retry_requested' } })).toBe(
      closed,
    )
    expect(step({ model: closed, event: { type: 'close' } })).toBe(closed)
  })
})

describe('additional transition boundaries', () => {
  it.each([
    {
      event: { type: LIMITED, issue: LOCK_UNAVAILABLE },
      status: LIMITED,
    },
    {
      event: { type: PAUSED, issue: NOT_CONFIGURED },
      status: PAUSED,
    },
  ] as const)(
    'projects $event.issue without enabling send',
    ({ event, status }) => {
      const started = step({
        model: initialConnectionModel,
        event: { type: 'start' },
      })
      const next = step({
        model: started,
        event: { ...event, generation: started.generation },
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
    model = step({
      model,
      event: {
        type: 'delivery_applied',
        generation: oldGeneration,
        token: 'current-proof',
      },
    })
    expect(
      step({
        model,
        event: {
          type: 'ack_confirmed',
          generation: oldGeneration,
          token: 'stale-proof',
        },
      }),
    ).toBe(model)
    model = step({ model, event: { type: 'retry_requested' } })
    expect(pendingAckToken(model)).toBeNull()
    expect(
      step({
        model,
        event: { type: 'temporary_failure', generation: oldGeneration },
      }),
    ).toBe(model)
    model = step({ model, event: { type: 'start' } })
    const restored = transitionConnection(model, {
      type: 'settings_ready',
      generation: model.generation,
      outgoingEnabled: true,
    })
    expect(restored.commands).toEqual(['publish_recovery'])
    expect(toConnectionState(restored.model).canSend).toBe(true)
  })
})
