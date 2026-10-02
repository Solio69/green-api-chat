import { applyNotification } from './apply-notification'
import { createSseParser } from './parse-sse'
import type { SseFrame } from './parse-sse'
import { createNotificationChatRefresh } from './refresh-notification-chats'
import type { OwnerContext } from './types'
import { isNotificationDelivery } from './validate-delivery'
import { isRecord } from '@/lib/api/is-record'
import { isChatId } from '@/lib/chats/validate-chat-id'
import type { QuerySession } from '@/lib/query/create-query-session'
import { SessionQueryError } from '@/lib/query/session-query-error'
import { API_ERROR_CODE, API_RESPONSE_STATUS } from '@/lib/api/constants'
import {
  CACHE_CONTROL,
  FETCH_CREDENTIALS,
  HTTP_CONTENT_TYPE,
  HTTP_SYNTAX,
  HTTP_HEADERS,
  HTTP_METHOD,
  HTTP_STATUS,
} from '@/lib/http/constants'
import {
  NOTIFICATION_CONFIG,
  NOTIFICATION_CODE,
  NOTIFICATION_EVENT,
  NOTIFICATION_ROUTES,
  NOTIFICATION_STATE,
} from './constants'

const {
  INVALID_UPSTREAM,
  OWNERSHIP_BUSY,
  NOT_OWNER,
  STREAM_ALREADY_OPEN,
  NOT_CONFIGURED,
  DELETE_FAILED,
  DELIVERY_CHANGED,
  RETRY_LATER,
} = NOTIFICATION_CODE
const { CONNECTION_SCOPE, CONTENT_TYPE } = HTTP_HEADERS
const { CONTENT_TYPE_PARAMETER_SEPARATOR } = HTTP_SYNTAX
const { POST } = HTTP_METHOD
const { SAME_ORIGIN } = FETCH_CREDENTIALS
const { NO_STORE } = CACHE_CONTROL
const { JSON: JSON_CONTENT_TYPE } = HTTP_CONTENT_TYPE
const { OK: RESPONSE_OK } = API_RESPONSE_STATUS
const { READY, NOTIFICATION, STATE, ERROR } = NOTIFICATION_EVENT
const { OUTGOING_DISABLED, SSE_BASE_CONTENT_TYPE } = NOTIFICATION_CONFIG
const { RECEIVING } = NOTIFICATION_STATE

export type ConnectionState = {
  status:
    | 'claiming'
    | 'connecting'
    | 'connected'
    | 'retrying'
    | 'limited'
    | 'paused'
    | 'closed'
  canSend: boolean
  issue: string | null
}
const { OWNER_HEADER, GRACE_MS, STALL_MS, BACKOFF_MS, CAPABILITY_PATTERN } =
  NOTIFICATION_CONFIG
const { CLAIM, STREAM, ACK, RELEASE } = NOTIFICATION_ROUTES
const { BACKOFF_JITTER_MIN, BACKOFF_JITTER_RANGE } = NOTIFICATION_CONFIG
const { SESSION_REQUIRED, CONNECTION_CHANGED } = API_ERROR_CODE
const { OK, UNAUTHORIZED, CONFLICT } = HTTP_STATUS
const { CONNECTED, CLOSED, CLAIMING, CONNECTING, LIMITED, PAUSED, RETRYING } =
  NOTIFICATION_STATE
const invalidFrame = () =>
  new SessionQueryError({
    code: INVALID_UPSTREAM,
    status: null,
  })
export const createNotificationConnection = ({
  session,
  fetcher = fetch,
}: {
  session: QuerySession
  fetcher?: typeof fetch
}) => {
  let state: ConnectionState = { status: CLOSED, canSend: false, issue: null }
  let owner: OwnerContext | null = null
  let outgoingEnabled = true
  let graceDeadline: number | null = null
  let generation = 0
  let running = false
  let runningTask: Promise<void> | null = null
  let retained = 0
  let disposal: ReturnType<typeof setTimeout> | undefined
  let graceTimer: ReturnType<typeof setTimeout> | undefined
  let stallTimer: ReturnType<typeof setTimeout> | undefined
  let abort: AbortController | null = null
  let readyOnce = false
  let closed = false
  const listeners = new Set<() => void>()
  const recoveryListeners = new Set<() => void>()
  const refresh = createNotificationChatRefresh(session)
  const setState = (next: ConnectionState) => {
    state = next
    listeners.forEach((listener) => listener())
  }
  const headers = (proof: OwnerContext | null) => ({
    [CONNECTION_SCOPE]: session.connectionScope,
    ...(proof ? { [OWNER_HEADER]: proof.ownerCapability } : {}),
  })
  const currentOwner = (context: OwnerContext) => {
    const retainedOwner =
      owner !== null &&
      session.isActive() &&
      !closed &&
      context.connectionScope === owner.connectionScope &&
      context.ownerEpoch === owner.ownerEpoch &&
      context.ownerCapability === owner.ownerCapability &&
      (graceDeadline === null || Date.now() < graceDeadline)
    return retainedOwner
  }
  const captureOwnerContext = () =>
    owner && currentOwner(owner) ? { ...owner } : null
  const clearOwner = () => {
    owner = null
    graceDeadline = null
    clearTimeout(graceTimer)
  }
  const post = async ({
    url,
    body,
    proof,
    signal,
  }: {
    url: string
    body: object
    proof: OwnerContext | null
    signal?: AbortSignal
  }) => {
    const response = await fetcher(url, {
      method: POST,
      credentials: SAME_ORIGIN,
      cache: NO_STORE,
      headers: {
        ...headers(proof),
        [CONTENT_TYPE]: JSON_CONTENT_TYPE,
      },
      body: JSON.stringify(body),
      signal,
    })
    const value: unknown = await response.json()
    if (!isRecord(value)) throw invalidFrame()
    const rejected = response.status !== OK || value.status !== RESPONSE_OK
    if (rejected)
      throw new SessionQueryError({
        code: typeof value.code === 'string' ? value.code : INVALID_UPSTREAM,
        status: response.status,
      })
    if (value.connectionScope !== session.connectionScope)
      throw new SessionQueryError({
        code: CONNECTION_CHANGED,
        status: CONFLICT,
      })
    return value
  }
  const release = async (proof: OwnerContext | null) => {
    if (!proof) return
    await post({ url: RELEASE, body: {}, proof }).catch(() => undefined)
  }
  const close = () => {
    if (closed) return
    closed = true
    generation += 1
    abort?.abort()
    clearTimeout(stallTimer)
    clearTimeout(disposal)
    const proof = owner
    clearOwner()
    refresh.close()
    setState({ status: CLOSED, canSend: false, issue: null })
    void release(proof)
  }
  session.registerCleanup(close)
  const wait = ({ delay, signal }: { delay: number; signal: AbortSignal }) =>
    new Promise<void>((resolve) => {
      if (signal.aborted) {
        resolve()
        return
      }
      const finish = () => {
        clearTimeout(timer)
        signal.removeEventListener('abort', finish)
        resolve()
      }
      const timer = setTimeout(finish, delay)
      signal.addEventListener('abort', finish, { once: true })
    })
  const backoff = (attempt: number) =>
    BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)] *
    (BACKOFF_JITTER_MIN + Math.random() * BACKOFF_JITTER_RANGE)
  const handleFailure = async (error: unknown) => {
    if (!(error instanceof SessionQueryError)) return false
    const auth =
      (error.code === SESSION_REQUIRED && error.status === UNAUTHORIZED) ||
      (error.code === CONNECTION_CHANGED && error.status === CONFLICT)
    if (auth) {
      await session.handleSessionError(error)
      return true
    }
    const limited =
      error.code === OWNERSHIP_BUSY ||
      error.code === NOT_OWNER ||
      error.code === STREAM_ALREADY_OPEN
    if (limited) {
      clearOwner()
      setState({ status: LIMITED, canSend: false, issue: error.code })
      return true
    }
    const paused =
      error.code === INVALID_UPSTREAM ||
      error.code === NOT_CONFIGURED ||
      error.code === DELETE_FAILED
    if (paused) {
      setState({ status: PAUSED, canSend: false, issue: error.code })
      return true
    }
    return false
  }
  const ack = async ({
    deliveryId,
    signal,
    attemptGeneration,
  }: {
    deliveryId: string
    signal: AbortSignal
    attemptGeneration: number
  }) => {
    let failures = 0
    while (
      !signal.aborted &&
      generation === attemptGeneration &&
      owner !== null
    ) {
      try {
        const response = await post({
          url: ACK,
          body: { deliveryId },
          proof: owner,
          signal,
        })
        if (response.deliveryId !== deliveryId) throw invalidFrame()
        return
      } catch (error) {
        if (signal.aborted) return
        const deliveryChanged =
          error instanceof SessionQueryError && error.code === DELIVERY_CHANGED
        if (deliveryChanged) return
        if (await handleFailure(error)) {
          abort?.abort()
          return
        }
        await wait({ delay: backoff(failures++), signal })
      }
    }
  }
  const frame = async ({
    value,
    signal,
    attemptGeneration,
  }: {
    value: SseFrame
    signal: AbortSignal
    attemptGeneration: number
  }) => {
    if (!Object.values(NOTIFICATION_EVENT).some((name) => name === value.event))
      return
    let data: unknown
    try {
      data = JSON.parse(value.data) as unknown
    } catch {
      throw invalidFrame()
    }
    if (!isRecord(data)) throw invalidFrame()
    const matching =
      owner !== null &&
      data.connectionScope === session.connectionScope &&
      data.ownerEpoch === owner.ownerEpoch &&
      generation === attemptGeneration &&
      session.isActive()
    if (!matching) throw invalidFrame()
    if (value.event === READY) {
      graceDeadline = null
      clearTimeout(graceTimer)
      setState({
        status: CONNECTED,
        canSend: true,
        issue: outgoingEnabled ? null : OUTGOING_DISABLED,
      })
      if (readyOnce) recoveryListeners.forEach((listener) => listener())
      readyOnce = true
    } else if (value.event === NOTIFICATION) {
      if (!owner) throw invalidFrame()
      if (!isNotificationDelivery(data)) throw invalidFrame()
      const applied = applyNotification({
        session,
        delivery: data,
        ownerEpoch: owner.ownerEpoch,
        refreshChats: refresh.request,
      })
      if (!applied) throw invalidFrame()
      await ack({
        deliveryId: data.deliveryId,
        signal,
        attemptGeneration,
      })
    } else if (value.event === STATE) {
      if (data.state === PAUSED) {
        setState({
          status: PAUSED,
          canSend: false,
          issue: typeof data.code === 'string' ? data.code : INVALID_UPSTREAM,
        })
        throw invalidFrame()
      }
      if (data.state === RETRYING)
        setState({
          status: RETRYING,
          canSend: false,
          issue: RETRY_LATER,
        })
      else if (data.state === RECEIVING)
        setState({
          status: CONNECTED,
          canSend: true,
          issue: outgoingEnabled ? null : OUTGOING_DISABLED,
        })
      else throw invalidFrame()
    } else if (value.event === ERROR) {
      if (!isChatId(data.code)) throw invalidFrame()
      throw new SessionQueryError({
        code: data.code,
        status: data.code === SESSION_REQUIRED ? UNAUTHORIZED : null,
      })
    }
  }
  const readStream = async ({
    signal,
    attemptGeneration,
  }: {
    signal: AbortSignal
    attemptGeneration: number
  }) => {
    const response = await fetcher(STREAM, {
      credentials: SAME_ORIGIN,
      cache: NO_STORE,
      headers: headers(owner),
      signal,
    })
    if (!response.ok) {
      const value: unknown = await response.json()
      throw new SessionQueryError({
        code:
          isRecord(value) && typeof value.code === 'string'
            ? value.code
            : RETRY_LATER,
        status: response.status,
      })
    }
    const validStream =
      response.headers
        .get(CONTENT_TYPE)
        ?.split(CONTENT_TYPE_PARAMETER_SEPARATOR)[0] ===
        SSE_BASE_CONTENT_TYPE && response.body !== null
    if (!validStream) throw invalidFrame()
    if (!response.body) throw invalidFrame()
    const reader = response.body.getReader()
    const parser = createSseParser()
    const resetStall = () => {
      clearTimeout(stallTimer)
      stallTimer = setTimeout(() => abort?.abort(), STALL_MS)
    }
    resetStall()
    try {
      while (!signal.aborted && generation === attemptGeneration) {
        const chunk = await reader.read()
        if (chunk.done) break
        let frames: SseFrame[]
        try {
          frames = parser.push(chunk.value)
        } catch {
          throw invalidFrame()
        }
        for (const value of frames) {
          await frame({ value, signal, attemptGeneration })
          resetStall()
        }
      }
      try {
        parser.finish()
      } catch {
        throw invalidFrame()
      }
    } finally {
      clearTimeout(stallTimer)
      await reader.cancel().catch(() => undefined)
      reader.releaseLock()
    }
  }
  const run = async (attemptGeneration: number) => {
    if (running) return
    running = true
    let failures = 0
    try {
      while (
        !closed &&
        session.isActive() &&
        generation === attemptGeneration
      ) {
        abort = new AbortController()
        const signal = abort.signal
        try {
          if (!owner) {
            setState({ status: CLAIMING, canSend: false, issue: null })
            const result = await post({
              url: CLAIM,
              body: {},
              proof: null,
              signal,
            })
            const valid =
              typeof result.ownerCapability === 'string' &&
              CAPABILITY_PATTERN.test(result.ownerCapability) &&
              isChatId(result.ownerEpoch) &&
              typeof result.outgoingEnabled === 'boolean'
            if (!valid) throw invalidFrame()
            const obsolete = closed || generation !== attemptGeneration
            if (obsolete) return
            owner = {
              connectionScope: session.connectionScope,
              ownerCapability: result.ownerCapability as string,
              ownerEpoch: result.ownerEpoch as string,
            }
            outgoingEnabled = result.outgoingEnabled as boolean
          }
          setState({ status: CONNECTING, canSend: false, issue: null })
          await readStream({ signal, attemptGeneration })
        } catch (error) {
          const obsolete = closed || generation !== attemptGeneration
          if (obsolete) return
          if (state.status === PAUSED) return
          if (await handleFailure(error)) return
        }
        const obsolete = closed || generation !== attemptGeneration
        if (obsolete) return
        abort.abort()
        const beginsGrace = owner !== null && graceDeadline === null
        if (beginsGrace) {
          graceDeadline = Date.now() + GRACE_MS
          graceTimer = setTimeout(() => {
            generation += 1
            clearOwner()
            setState({
              status: LIMITED,
              canSend: false,
              issue: NOT_OWNER,
            })
            abort?.abort()
          }, GRACE_MS)
        }
        setState({
          status: RETRYING,
          canSend: false,
          issue: RETRY_LATER,
        })
        const delayAbort = new AbortController()
        abort = delayAbort
        await wait({ delay: backoff(failures++), signal: delayAbort.signal })
        if (state.status === LIMITED) return
      }
    } finally {
      running = false
    }
  }
  const start = () => {
    const available = !running && !closed && session.isActive()
    if (available) runningTask = run(generation)
  }
  const retry = async () => {
    const unavailable = closed || !session.isActive()
    if (unavailable) return
    const proof = owner
    const previousTask = runningTask
    generation += 1
    const retryGeneration = generation
    abort?.abort()
    clearTimeout(stallTimer)
    clearOwner()
    setState({ status: CONNECTING, canSend: false, issue: null })
    await release(proof)
    await previousTask
    if (generation === retryGeneration) start()
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
    getOwnedHeaders: () => {
      const proof = captureOwnerContext()
      return proof && headers(proof)
    },
    getOwnerHeaders: () => (state.canSend ? headers(owner) : null),
  }
}
