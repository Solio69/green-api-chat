import { setTimeout as wait } from 'node:timers/promises'
import type { ReceiverProvider } from '@/lib/notifications/types'
import type {
  SendMessageOptions,
  ProviderSendResult,
} from '@/lib/sending/types'
import { HISTORY_TEST } from '../../../history/constants'
import { NOTIFICATION_TEST } from '../../../notifications/constants'
import {
  TEST_API_CODE,
  TEST_API_RESPONSE,
  TEST_PROVIDER_PROTOCOL,
} from '../../../protocol.constants'

const FIXTURE_CONFIG = {
  PASSWORD: 'fictional-fixture-password-with-more-than-32-characters',
  KEY: 'green-api-chat.messaging-fixture.v1',
  RECEIVE_DELAY_MS: 50,
  SEND_DELAY_MS: 100,
  SESSION_TTL_MS: 3_600_000,
  SEND_ID_PREFIX: 'fixture-send-',
  INCOMING_ID_PREFIX: 'fixture-incoming-',
  SENDER_LABEL: 'Тестовый собеседник',
} as const
const {
  KEY,
  RECEIVE_DELAY_MS,
  SEND_DELAY_MS,
  SESSION_TTL_MS,
  SEND_ID_PREFIX,
  INCOMING_ID_PREFIX,
  SENDER_LABEL,
} = FIXTURE_CONFIG
const { OK } = TEST_API_RESPONSE
const { OUTCOME_UNKNOWN } = TEST_API_CODE
const {
  TELEGRAM,
  STATUS_WEBHOOK: STATUS,
  USER,
  TEXT_MESSAGE: TEXT,
} = TEST_PROVIDER_PROTOCOL
const INCOMING = 'incomingMessageReceived'
const { CREDENTIALS, TIMESTAMP } = NOTIFICATION_TEST
const { scopeA, chatA } = HISTORY_TEST
type FixtureState = {
  queue: unknown[]
  receipt: number
  sends: { chatId: string; message: string }[]
  deletes: number[]
  sendDelay: number
  unknown: boolean
  claims: number
}
const createFixture = () => {
  const newState = (): FixtureState => ({
    queue: [],
    receipt: 0,
    sends: [],
    deletes: [],
    sendDelay: SEND_DELAY_MS,
    unknown: false,
    claims: 0,
  })
  const newContext = () => ({
    credentials: { ...CREDENTIALS },
    connectionScope: scopeA,
    expiresAt: Date.now() + SESSION_TTL_MS,
  })
  let state = newState()
  let context = newContext()
  let generation = 0
  const provider: ReceiverProvider = {
    settings: async () => {
      state.claims += 1
      return { outgoingEnabled: true }
    },
    receive: async ({ signal }) => {
      const receiveState = state
      await wait(RECEIVE_DELAY_MS, undefined, { signal })
      return receiveState === state ? (receiveState.queue[0] ?? null) : null
    },
    delete: async ({ receiptId }) => {
      state.deletes.push(receiptId)
      const head = state.queue[0] as { receiptId: number } | undefined
      if (head?.receiptId !== receiptId) return false
      state.queue.shift()
      return true
    },
  }
  const enqueue = (body: Record<string, unknown>) => {
    state.receipt += 1
    state.queue.push({
      receiptId: state.receipt,
      body: {
        instanceData: {
          idInstance: CREDENTIALS.idInstance,
          typeInstance: TELEGRAM,
        },
        timestamp: TIMESTAMP,
        ...body,
      },
    })
  }
  const send = async ({
    chatId,
    message,
  }: SendMessageOptions): Promise<ProviderSendResult> => {
    const sendState = state
    const sendGeneration = generation
    sendState.sends.push({ chatId, message })
    const count = sendState.sends.length
    await wait(sendState.sendDelay)
    if (sendGeneration !== generation || sendState.unknown)
      return { kind: OUTCOME_UNKNOWN }
    return { kind: OK, idMessage: `${SEND_ID_PREFIX}${count}` }
  }
  const inject = ({
    status,
    text,
    chatId = chatA,
    idMessage,
  }: {
    status?: string
    text?: string
    chatId?: string
    idMessage?: string | null
  }) => {
    if (status)
      enqueue({
        typeWebhook: STATUS,
        chatId,
        ...(idMessage !== null
          ? { idMessage: idMessage ?? `${SEND_ID_PREFIX}${state.sends.length}` }
          : {}),
        status,
      })
    else
      enqueue({
        typeWebhook: INCOMING,
        idMessage: idMessage ?? `${INCOMING_ID_PREFIX}${state.receipt + 1}`,
        senderData: {
          chatId,
          chatType: USER,
          senderName: SENDER_LABEL,
        },
        messageData: {
          typeMessage: TEXT,
          textMessageData: { textMessage: text },
        },
      })
  }
  const reset = () => {
    generation += 1
    state = newState()
    context = newContext()
  }
  return {
    get context() {
      return context
    },
    provider,
    password: FIXTURE_CONFIG.PASSWORD,
    get state() {
      return state
    },
    send,
    inject,
    reset,
  }
}
const key = Symbol.for(KEY)
const processState = globalThis as typeof globalThis & {
  [key]?: ReturnType<typeof createFixture>
}
export const notificationFixture = (processState[key] ??= createFixture())
