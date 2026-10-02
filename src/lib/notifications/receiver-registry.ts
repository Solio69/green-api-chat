import { randomBytes } from 'node:crypto'
import type {
  ClaimResult,
  OwnerAttachmentResult,
  DeliveryAckResult,
  ReceiverContext,
  ReceiverProvider,
  NotificationSink,
} from './types'
import { isRecord } from '@/lib/api/is-record'
import type { AcquireSendOptions, SendLeaseResult } from '@/lib/sending/types'
import { API_ERROR_CODE, API_RESPONSE_STATUS } from '@/lib/api/constants'
import {
  NOTIFICATION_CODE,
  NOTIFICATION_CONFIG,
  NOTIFICATION_EVENT,
  NOTIFICATION_STATE,
} from './constants'

const { OK: RESULT_OK, ERROR: RESULT_ERROR } = API_RESPONSE_STATUS
const { RETRY_LATER, DELIVERY_CHANGED } = NOTIFICATION_CODE
const { STATE } = NOTIFICATION_EVENT
const { RETRYING, RECEIVING, PAUSED } = NOTIFICATION_STATE
const { IDENTIFIER_BYTES, IDENTIFIER_ENCODING } = NOTIFICATION_CONFIG
const { SESSION_REQUIRED } = API_ERROR_CODE

const { GRACE_MS, CLAIM_MS } = NOTIFICATION_CONFIG
const {
  OWNERSHIP_BUSY,
  NOT_OWNER,
  RECEIVER_NOT_ACTIVE,
  STREAM_ALREADY_OPEN,
  SEND_IN_PROGRESS,
} = NOTIFICATION_CODE
const { READY } = NOTIFICATION_EVENT
const createCapability = () =>
  randomBytes(IDENTIFIER_BYTES).toString(IDENTIFIER_ENCODING)
export type ReceiverLoopAccess = {
  wake: () => void
  stop: () => void
  ack: (deliveryId: string) => boolean
}
type OwnerEntry = {
  context: ReceiverContext
  ownerEpoch: string
  ownerCapability: string
  published: boolean
  revoked: boolean
  paused: boolean
  retrying: boolean
  pausedCode?: string
  deadline: number
  generation: number
  inFlight: number
  sendHeld: boolean
  sink: NotificationSink | null
  timer?: ReturnType<typeof setTimeout>
  loop?: ReceiverLoopAccess
}
export type StartReceiverOptions = {
  context: ReceiverContext
  ownerEpoch: string
  active: () => boolean
  emit: NotificationSink['emit']
  operation: (delta: number) => void
  pause: (code: string) => void
}
export const createReceiverRegistry = ({
  provider,
  now = Date.now,
  startReceiver,
}: {
  provider: ReceiverProvider
  now?: () => number
  startReceiver?: (options: StartReceiverOptions) => ReceiverLoopAccess
}) => {
  const owners = new Map<string, OwnerEntry>()
  let invalidated = false
  const matches = ({
    entry,
    context,
  }: {
    entry: OwnerEntry
    context: ReceiverContext
  }) => {
    const valid =
      entry.context.connectionScope === context.connectionScope &&
      entry.context.credentials.apiTokenInstance ===
        context.credentials.apiTokenInstance &&
      entry.ownerCapability === context.ownerCapability
    return valid
  }
  const retire = (entry: OwnerEntry) => {
    if (!entry.revoked) {
      entry.revoked = true
      clearTimeout(entry.timer)
      const sink = entry.sink
      entry.sink = null
      entry.loop?.stop()
      sink?.close()
    }
    const drained = entry.inFlight === 0 && !entry.sendHeld
    if (drained) owners.delete(entry.context.credentials.idInstance)
  }
  const sweep = (entry: OwnerEntry) => {
    const expired = now() >= entry.deadline || now() >= entry.context.expiresAt
    if (expired) retire(entry)
  }
  const arm = (entry: OwnerEntry) => {
    clearTimeout(entry.timer)
    const delay = Math.max(
      0,
      Math.min(entry.deadline, entry.context.expiresAt) - now(),
    )
    entry.timer = setTimeout(() => retire(entry), delay)
    entry.timer.unref?.()
  }
  const lookup = (context: ReceiverContext) => {
    const entry = owners.get(context.credentials.idInstance)
    if (!entry) return null
    sweep(entry)
    const valid =
      !entry.revoked && entry.published && matches({ entry, context })
    return valid ? entry : null
  }
  const claimOwner = async (context: ReceiverContext): Promise<ClaimResult> => {
    if (invalidated) return { kind: RESULT_ERROR, code: OWNERSHIP_BUSY }
    const current = owners.get(context.credentials.idInstance)
    if (current) sweep(current)
    if (owners.has(context.credentials.idInstance))
      return { kind: RESULT_ERROR, code: OWNERSHIP_BUSY }
    if (context.expiresAt <= now())
      return { kind: RESULT_ERROR, code: NOT_OWNER }
    const entry: OwnerEntry = {
      context,
      ownerEpoch: createCapability(),
      ownerCapability: createCapability(),
      published: false,
      revoked: false,
      paused: false,
      retrying: false,
      deadline: context.expiresAt,
      generation: 0,
      inFlight: 1,
      sendHeld: false,
      sink: null,
    }
    owners.set(context.credentials.idInstance, entry)
    arm(entry)
    try {
      const settings = await provider.settings(context)
      sweep(entry)
      if (entry.revoked) return { kind: RESULT_ERROR, code: NOT_OWNER }
      entry.published = true
      entry.deadline = now() + CLAIM_MS
      arm(entry)
      return {
        kind: RESULT_OK,
        ownerCapability: entry.ownerCapability,
        ownerEpoch: entry.ownerEpoch,
        outgoingEnabled: settings.outgoingEnabled,
      }
    } catch (error) {
      retire(entry)
      const code = error instanceof ReceiverError ? error.code : RETRY_LATER
      return { kind: RESULT_ERROR, code }
    } finally {
      entry.inFlight -= 1
      if (entry.revoked) retire(entry)
    }
  }
  const attachOwner = ({
    context,
    sink,
  }: {
    context: ReceiverContext
    sink: NotificationSink
  }): OwnerAttachmentResult => {
    const entry = lookup(context)
    if (!entry) return { kind: RESULT_ERROR, code: NOT_OWNER }
    if (entry.sink) return { kind: RESULT_ERROR, code: STREAM_ALREADY_OPEN }
    const wasPaused = entry.paused
    entry.sink = sink
    entry.generation += 1
    entry.deadline = entry.context.expiresAt
    arm(entry)
    const active = () => {
      sweep(entry)
      return !entry.revoked && entry.sink !== null && !entry.paused
    }
    const emit: NotificationSink['emit'] = (frame) => {
      sweep(entry)
      if (entry.revoked) return false
      const stateFrame = frame.event === STATE && isRecord(frame.data)
      if (stateFrame) {
        if (!isRecord(frame.data)) return false
        if (frame.data.state === RETRYING) entry.retrying = true
        if (frame.data.state === RECEIVING) entry.retrying = false
      }
      return entry.sink?.emit(frame) ?? false
    }
    emit({
      event: READY,
      data: {
        connectionScope: context.connectionScope,
        ownerEpoch: entry.ownerEpoch,
      },
    })
    const startNewReceiver = !entry.loop && startReceiver
    if (startNewReceiver)
      entry.loop = startNewReceiver({
        context: entry.context,
        ownerEpoch: entry.ownerEpoch,
        active,
        emit,
        operation: (delta) => {
          entry.inFlight += delta
          if (entry.revoked) retire(entry)
        },
        pause: (code) => {
          if (code === SESSION_REQUIRED) {
            retire(entry)
            return
          }
          entry.paused = true
          entry.pausedCode = code
          emit({
            event: STATE,
            data: {
              connectionScope: context.connectionScope,
              ownerEpoch: entry.ownerEpoch,
              state: PAUSED,
              code,
            },
          })
        },
      })
    if (wasPaused)
      emit({
        event: STATE,
        data: {
          connectionScope: context.connectionScope,
          ownerEpoch: entry.ownerEpoch,
          state: PAUSED,
          code: entry.pausedCode,
        },
      })
    if (entry.retrying)
      emit({
        event: STATE,
        data: {
          connectionScope: context.connectionScope,
          ownerEpoch: entry.ownerEpoch,
          state: RETRYING,
          code: RETRY_LATER,
        },
      })
    entry.loop?.wake()
    return {
      kind: RESULT_OK,
      streamGeneration: entry.generation,
      ownerEpoch: entry.ownerEpoch,
    }
  }
  const detachOwner = ({
    context,
    streamGeneration,
  }: {
    context: ReceiverContext
    streamGeneration: number
  }) => {
    const entry = lookup(context)
    if (!entry) return
    if (entry.generation !== streamGeneration) return
    entry.sink = null
    entry.deadline = now() + GRACE_MS
    arm(entry)
  }
  const releaseOwner = (context: ReceiverContext) => {
    const entry = lookup(context)
    if (entry) retire(entry)
  }
  const tryAcquireSend = (options: AcquireSendOptions): SendLeaseResult => {
    const entry = lookup({ ...options, expiresAt: Infinity })
    if (!entry) return { kind: NOT_OWNER }
    if (entry.sendHeld) return { kind: SEND_IN_PROGRESS }
    const healthy = entry.sink !== null && !entry.paused && !entry.retrying
    if (!healthy) return { kind: RECEIVER_NOT_ACTIVE }
    entry.sendHeld = true
    let released = false
    return {
      kind: RESULT_OK,
      release: () => {
        if (released) return
        released = true
        entry.sendHeld = false
        if (entry.revoked) retire(entry)
      },
    }
  }
  const ackDelivery = ({
    context,
    deliveryId,
  }: {
    context: ReceiverContext
    deliveryId: string
  }): DeliveryAckResult => {
    const entry = lookup(context)
    if (!entry) return { kind: RESULT_ERROR, code: NOT_OWNER }
    if (!entry.sink) return { kind: RESULT_ERROR, code: RECEIVER_NOT_ACTIVE }
    if (!entry.loop?.ack(deliveryId))
      return {
        kind: RESULT_ERROR,
        code: DELIVERY_CHANGED,
      }
    return { kind: RESULT_OK }
  }
  const shutdown = () => {
    for (const entry of owners.values()) retire(entry)
  }
  return {
    claimOwner,
    attachOwner,
    detachOwner,
    releaseOwner,
    revokeOwner: releaseOwner,
    tryAcquireSend,
    ackDelivery,
    shutdown,
    invalidate: () => {
      invalidated = true
      shutdown()
    },
    isInvalidated: () => invalidated,
    isDrained: () => owners.size === 0,
  }
}

export class ReceiverError extends Error {
  readonly code: string
  readonly retryAfterMs: number
  constructor({
    code,
    retryAfterMs = 0,
  }: {
    code: string
    retryAfterMs?: number
  }) {
    super(code)
    this.code = code
    this.retryAfterMs = retryAfterMs
  }
}
