import type { POLLING_CONFIG } from './constants'
import {
  NOTIFICATION_CODE,
  NOTIFICATION_CONFIG,
  NOTIFICATION_STATE,
} from './constants'

const { CLOSED, CONNECTING, CONNECTED, RETRYING, LIMITED, PAUSED } =
  NOTIFICATION_STATE
const { RETRY_LATER } = NOTIFICATION_CODE
const { OUTGOING_DISABLED } = NOTIFICATION_CONFIG

type Common = {
  generation: number
  everConnected: boolean
  outgoingEnabled: boolean
}
type Active = Common & {
  status: typeof CONNECTED | typeof RETRYING
  pendingAck: string | null
}
export type ConnectionModel =
  | (Common & { status: typeof CLOSED; terminal: boolean })
  | (Common & { status: typeof CONNECTING })
  | Active
  | (Common & {
      status: typeof LIMITED
      issue:
        | typeof NOTIFICATION_CODE.OWNERSHIP_BUSY
        | typeof POLLING_CONFIG.LOCK_UNAVAILABLE
    })
  | (Common & {
      status: typeof PAUSED
      issue:
        | typeof NOTIFICATION_CODE.INVALID_UPSTREAM
        | typeof NOTIFICATION_CODE.NOT_CONFIGURED
    })

type TaggedEvent =
  | {
      type: 'settings_ready'
      generation: number
      outgoingEnabled: boolean
    }
  | { type: 'cycle_succeeded'; generation: number }
  | { type: 'delivery_applied'; generation: number; token: string }
  | { type: 'ack_confirmed'; generation: number; token: string }
  | { type: 'ack_expired'; generation: number }
  | { type: 'temporary_failure'; generation: number }
  | {
      type: 'limited'
      generation: number
      issue:
        | typeof NOTIFICATION_CODE.OWNERSHIP_BUSY
        | typeof POLLING_CONFIG.LOCK_UNAVAILABLE
    }
  | {
      type: 'paused'
      generation: number
      issue:
        | typeof NOTIFICATION_CODE.INVALID_UPSTREAM
        | typeof NOTIFICATION_CODE.NOT_CONFIGURED
    }
export type ConnectionEvent =
  | { type: 'start' }
  | { type: 'retry_requested' }
  | { type: 'close' }
  | TaggedEvent
export type ConnectionCommand = 'publish_recovery'
export type ConnectionState = {
  status: ConnectionModel['status']
  canSend: boolean
  issue: string | null
}
export type ConnectionTransition = {
  model: ConnectionModel
  commands: readonly ConnectionCommand[]
}

export const initialConnectionModel: ConnectionModel = {
  status: CLOSED,
  generation: 0,
  everConnected: false,
  outgoingEnabled: true,
  terminal: false,
}
const unchanged = (model: ConnectionModel): ConnectionTransition => ({
  model,
  commands: [],
})
const connected = (
  model: ConnectionModel,
  outgoingEnabled: boolean,
): ConnectionTransition => ({
  model: {
    status: CONNECTED,
    generation: model.generation,
    everConnected: true,
    outgoingEnabled,
    pendingAck: null,
  },
  commands:
    model.status !== CONNECTED && model.everConnected
      ? ['publish_recovery']
      : [],
})

export const transitionConnection = (
  model: ConnectionModel,
  event: ConnectionEvent,
): ConnectionTransition => {
  if (model.status === CLOSED && model.terminal) return unchanged(model)
  if (event.type === 'close')
    return {
      model: {
        status: CLOSED,
        generation: model.generation + 1,
        everConnected: model.everConnected,
        outgoingEnabled: model.outgoingEnabled,
        terminal: true,
      },
      commands: [],
    }
  if (event.type === 'retry_requested') {
    const next = { ...model, generation: model.generation + 1 }
    if (next.status === CONNECTED || next.status === RETRYING)
      return { model: { ...next, pendingAck: null }, commands: [] }
    return { model: next, commands: [] }
  }
  if (event.type === 'start') {
    if (model.status === CONNECTING) return unchanged(model)
    return {
      model: {
        status: CONNECTING,
        generation: model.generation,
        everConnected: model.everConnected,
        outgoingEnabled: model.outgoingEnabled,
      },
      commands: [],
    }
  }
  if (event.generation !== model.generation || model.status === CLOSED)
    return unchanged(model)
  if (event.type === 'settings_ready') {
    if (model.status !== CONNECTING && model.status !== RETRYING)
      return unchanged(model)
    return connected(model, event.outgoingEnabled)
  }
  if (event.type === 'cycle_succeeded') {
    if (model.status !== CONNECTED && model.status !== RETRYING)
      return unchanged(model)
    if (model.pendingAck !== null) return unchanged(model)
    if (model.status === CONNECTED) return unchanged(model)
    return connected(model, model.outgoingEnabled)
  }
  if (event.type === 'delivery_applied') {
    if (model.status !== CONNECTED && model.status !== RETRYING)
      return unchanged(model)
    if (model.pendingAck !== null) return unchanged(model)
    return { model: { ...model, pendingAck: event.token }, commands: [] }
  }
  if (event.type === 'ack_confirmed' || event.type === 'ack_expired') {
    if (model.status !== CONNECTED && model.status !== RETRYING)
      return unchanged(model)
    if (model.pendingAck === null) return unchanged(model)
    if (event.type === 'ack_confirmed' && event.token !== model.pendingAck)
      return unchanged(model)
    return { model: { ...model, pendingAck: null }, commands: [] }
  }
  if (event.type === 'temporary_failure') {
    if (model.status === RETRYING) return unchanged(model)
    if (model.status !== CONNECTING && model.status !== CONNECTED)
      return unchanged(model)
    return {
      model: {
        status: RETRYING,
        generation: model.generation,
        everConnected: model.everConnected,
        outgoingEnabled: model.outgoingEnabled,
        pendingAck: model.status === CONNECTED ? model.pendingAck : null,
      },
      commands: [],
    }
  }
  if (event.type === 'limited')
    return {
      model: {
        status: LIMITED,
        generation: model.generation,
        everConnected: model.everConnected,
        outgoingEnabled: model.outgoingEnabled,
        issue: event.issue,
      },
      commands: [],
    }
  if (event.type === 'paused')
    return {
      model: {
        status: PAUSED,
        generation: model.generation,
        everConnected: model.everConnected,
        outgoingEnabled: model.outgoingEnabled,
        issue: event.issue,
      },
      commands: [],
    }
  return unchanged(model)
}

const connectionIssue = (model: ConnectionModel): string | null => {
  if (model.status === CONNECTED)
    return model.outgoingEnabled ? null : OUTGOING_DISABLED
  if (model.status === RETRYING) return RETRY_LATER
  if (model.status === LIMITED || model.status === PAUSED) return model.issue
  return null
}
export const toConnectionState = (model: ConnectionModel): ConnectionState => ({
  status: model.status,
  canSend: model.status === CONNECTED,
  issue: connectionIssue(model),
})
export const pendingAckToken = (model: ConnectionModel): string | null =>
  model.status === CONNECTED || model.status === RETRYING
    ? model.pendingAck
    : null
