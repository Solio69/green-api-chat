import type { FetchSendOptions } from './fetch-send-message'
import { SendMessageError } from './fetch-send-message'
import type { AcceptedSend } from './types'
import { rememberPersonalChat } from '@/lib/chats/session-chat-facts'
import type { ConversationTarget } from '@/lib/conversations/types'
import { addAcceptedMessage } from '@/lib/messages/message-cache'
import { publishMessageIssues } from '@/lib/messages/message-status-issues'
import type { OwnerContext } from '@/lib/notifications/types'
import type { QuerySession } from '@/lib/query/create-query-session'
import { API_ERROR_CODE } from '@/lib/api/constants'
import { SESSION_CHAT_SOURCE } from '@/lib/chats/constants'
import { SEND_CONFIG, SEND_OUTCOME, SEND_RESULT_KIND } from './constants'

const { ACCEPTED: RESULT_ACCEPTED, ERROR: RESULT_ERROR } = SEND_RESULT_KIND
const { MAX_CODE_POINTS } = SEND_CONFIG
const { ACCEPTED: SESSION_CHAT_SOURCE_ACCEPTED } = SESSION_CHAT_SOURCE
const { UNKNOWN } = SEND_OUTCOME
const { OUTCOME_UNKNOWN } = API_ERROR_CODE

export type SendInput = {
  target: ConversationTarget
  text: string
  selectionEpoch: number
  editorRevision: number
}
export type PendingAttempt = SendInput & { attemptId: string }
export type AttemptResult =
  | {
      kind: typeof RESULT_ACCEPTED
      snapshot: PendingAttempt
      accepted: AcceptedSend
    }
  | {
      kind: typeof RESULT_ERROR
      snapshot: PendingAttempt
      code: string
      httpStatus: number | null
      outcome: 'not_sent' | 'unknown'
    }
export type SendControllerOptions = {
  session: QuerySession
  canSend: () => boolean
  captureOwnerContext: () => OwnerContext | null
  isCurrentOwnerContext: (context: OwnerContext) => boolean
  dispatch: (options: FetchSendOptions) => Promise<AcceptedSend>
}
export const createSendController = ({
  session,
  canSend,
  captureOwnerContext,
  isCurrentOwnerContext,
  dispatch,
}: SendControllerOptions) => {
  let pending = false
  let state: {
    pendingAttempt: PendingAttempt | null
    lastResult: AttemptResult | null
  } = { pendingAttempt: null, lastResult: null }
  const listeners = new Set<() => void>()
  const update = (next: typeof state) => {
    state = next
    listeners.forEach((listener) => listener())
  }
  session.registerCleanup(() =>
    update({ pendingAttempt: null, lastResult: null }),
  )
  const send = async (input: SendInput): Promise<AttemptResult | null> => {
    const allowed =
      !pending &&
      session.isActive() &&
      canSend() &&
      input.text.trim().length > 0 &&
      Array.from(input.text).length <= MAX_CODE_POINTS
    if (!allowed) return null
    const owner = captureOwnerContext()
    if (!owner) return null
    pending = true
    const snapshot: PendingAttempt = {
      ...input,
      target: { ...input.target },
      attemptId: crypto.randomUUID(),
    }
    update({ ...state, pendingAttempt: snapshot })
    try {
      const accepted = await dispatch({
        session,
        target: snapshot.target,
        text: snapshot.text,
        attemptId: snapshot.attemptId,
      })
      const current = session.isActive() && isCurrentOwnerContext(owner)
      if (!current) return null
      const { issues } = addAcceptedMessage({
        session,
        chatId: snapshot.target.chatId,
        idMessage: accepted.idMessage,
        text: snapshot.text,
        acceptedAt: Date.now(),
      })
      publishMessageIssues({ session, issues })
      rememberPersonalChat({
        session,
        chatId: snapshot.target.chatId,
        label: snapshot.target.label,
        source: SESSION_CHAT_SOURCE_ACCEPTED,
      })
      const result: AttemptResult = {
        kind: RESULT_ACCEPTED,
        snapshot,
        accepted,
      }
      update({ ...state, lastResult: result })
      return result
    } catch (error) {
      const current = session.isActive() && isCurrentOwnerContext(owner)
      if (!current) return null
      const known = error instanceof SendMessageError
      const previous = state.lastResult
      const preserveUnknown =
        previous?.kind === RESULT_ERROR &&
        previous.outcome === UNKNOWN &&
        previous.snapshot.target.chatId === snapshot.target.chatId &&
        previous.snapshot.selectionEpoch === snapshot.selectionEpoch &&
        previous.snapshot.editorRevision === snapshot.editorRevision
      let outcome: 'not_sent' | 'unknown' = UNKNOWN
      const useKnownOutcome = known && !preserveUnknown
      if (useKnownOutcome) outcome = error.outcome
      const result: AttemptResult = {
        kind: RESULT_ERROR,
        snapshot,
        code: known ? error.code : OUTCOME_UNKNOWN,
        httpStatus: known ? error.status : null,
        outcome,
      }
      update({ ...state, lastResult: result })
      return result
    } finally {
      pending = false
      update({ ...state, pendingAttempt: null })
    }
  }
  const clearResult = () => update({ ...state, lastResult: null })
  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }
  return { send, clearResult, subscribe, getSnapshot: () => state }
}
