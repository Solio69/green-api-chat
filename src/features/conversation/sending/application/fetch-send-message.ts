import { isChatId } from '@/features/chats/model'
import type { ConversationTarget } from '@/features/conversation/selection/model'
import type { AcceptedSend } from '@/features/conversation/sending/model/types'
import { isRecord } from '@/shared/kernel/api/is-record'
import type { QuerySession } from '@/shared/query/create-query-session'
import { SessionQueryError } from '@/shared/query/session-query-error'
import { SEND_OUTCOME } from '@/features/conversation/sending/model/constants'
import {
  API_ERROR_CODE,
  API_RESPONSE_STATUS,
} from '@/shared/kernel/api/constants'
import {
  CACHE_CONTROL,
  FETCH_CREDENTIALS,
  HTTP_CONTENT_TYPE,
  HTTP_HEADERS,
  HTTP_METHOD,
  HTTP_STATUS,
} from '@/shared/kernel/http/constants'
import { ROUTES } from '@/shared/kernel/routes/constants'

const { MESSAGES_API } = ROUTES
const { POST } = HTTP_METHOD
const { SAME_ORIGIN } = FETCH_CREDENTIALS
const { NO_STORE } = CACHE_CONTROL
const { CONTENT_TYPE, CONNECTION_SCOPE } = HTTP_HEADERS
const { JSON: JSON_CONTENT_TYPE } = HTTP_CONTENT_TYPE
const { OK: RESPONSE_OK, ERROR } = API_RESPONSE_STATUS

export class SendMessageError extends SessionQueryError {
  readonly outcome: 'not_sent' | 'unknown'
  constructor(options: {
    code: string
    status: number | null
    outcome: 'not_sent' | 'unknown'
  }) {
    super(options)
    this.outcome = options.outcome
  }
}
export type FetchSendOptions = {
  session: QuerySession
  target: ConversationTarget
  text: string
  attemptId: string
  fetcher?: typeof fetch
}
const { OK, UNAUTHORIZED, CONFLICT } = HTTP_STATUS
const { SESSION_REQUIRED, CONNECTION_CHANGED, OUTCOME_UNKNOWN } = API_ERROR_CODE
const { NOT_SENT, UNKNOWN } = SEND_OUTCOME
export const fetchSendMessage = async ({
  session,
  target,
  text,
  attemptId,
  fetcher = fetch,
}: FetchSendOptions): Promise<AcceptedSend> => {
  if (!session.isActive())
    throw new SendMessageError({
      code: SESSION_REQUIRED,
      status: UNAUTHORIZED,
      outcome: NOT_SENT,
    })
  try {
    const response = await fetcher(MESSAGES_API, {
      method: POST,
      credentials: SAME_ORIGIN,
      cache: NO_STORE,
      headers: {
        [CONTENT_TYPE]: JSON_CONTENT_TYPE,
        [CONNECTION_SCOPE]: session.connectionScope,
      },
      body: JSON.stringify({ chatId: target.chatId, message: text, attemptId }),
    })
    const value: unknown = await response.json()
    if (!isRecord(value))
      throw new SendMessageError({
        code: OUTCOME_UNKNOWN,
        status: response.status,
        outcome: UNKNOWN,
      })
    const accepted = response.status === OK && value.status === RESPONSE_OK
    if (accepted) {
      if (value.connectionScope !== session.connectionScope)
        throw new SendMessageError({
          code: CONNECTION_CHANGED,
          status: CONFLICT,
          outcome: UNKNOWN,
        })
      const valid =
        value.chatId === target.chatId &&
        value.attemptId === attemptId &&
        isChatId(value.idMessage)
      if (!valid)
        throw new SendMessageError({
          code: OUTCOME_UNKNOWN,
          status: response.status,
          outcome: UNKNOWN,
        })
      return {
        status: RESPONSE_OK,
        connectionScope: session.connectionScope,
        chatId: target.chatId,
        attemptId,
        idMessage: value.idMessage as string,
      }
    }
    const allowedCodes: readonly string[] = [...Object.values(API_ERROR_CODE)]
    const validError =
      value.status === ERROR &&
      typeof value.code === 'string' &&
      allowedCodes.includes(value.code) &&
      (value.outcome === NOT_SENT || value.outcome === UNKNOWN)
    if (!validError)
      throw new SendMessageError({
        code: OUTCOME_UNKNOWN,
        status: response.status,
        outcome: UNKNOWN,
      })
    throw new SendMessageError({
      code: value.code as string,
      status: response.status,
      outcome: value.outcome as 'not_sent' | 'unknown',
    })
  } catch (error) {
    if (!(error instanceof SendMessageError))
      throw new SendMessageError({
        code: OUTCOME_UNKNOWN,
        status: null,
        outcome: UNKNOWN,
      })
    const isSessionError =
      (error.code === SESSION_REQUIRED && error.status === UNAUTHORIZED) ||
      (error.code === CONNECTION_CHANGED && error.status === CONFLICT)
    if (isSessionError) await session.handleSessionError(error)
    throw error
  }
}
