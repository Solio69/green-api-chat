import { setTimeout as wait } from 'node:timers/promises'
import { createReceiverLoop } from '@/lib/notifications/receiver-loop'
import { createReceiverRegistry } from '@/lib/notifications/receiver-registry'
import type { ReceiverProvider } from '@/lib/notifications/types'
import type {
  SendMessageOptions,
  ProviderSendResult,
} from '@/lib/sending/types'
import { API_ERROR_CODE, API_RESPONSE_STATUS } from '@/lib/api/constants'
import { PROVIDER_NOTIFICATION } from '@/lib/notifications/constants'
import { HISTORY_TEST } from '../../../history/constants'
import { NOTIFICATION_TEST } from '../../../notifications/constants'

const FIXTURE_CONFIG = {
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
const { OK } = API_RESPONSE_STATUS
const { OUTCOME_UNKNOWN } = API_ERROR_CODE
const { TELEGRAM, STATUS, INCOMING, USER, TEXT } = PROVIDER_NOTIFICATION
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
  const state: FixtureState = {
    queue: [],
    receipt: 0,
    sends: [],
    deletes: [],
    sendDelay: SEND_DELAY_MS,
    unknown: false,
    claims: 0,
  }
  const context = {
    credentials: CREDENTIALS,
    connectionScope: scopeA,
    expiresAt: Date.now() + SESSION_TTL_MS,
  }
  const provider: ReceiverProvider = {
    settings: async () => {
      state.claims += 1
      return { outgoingEnabled: true }
    },
    receive: async () => {
      await wait(RECEIVE_DELAY_MS)
      return state.queue[0] ?? null
    },
    delete: async ({ receiptId }) => {
      state.deletes.push(receiptId)
      const head = state.queue[0] as { receiptId: number } | undefined
      if (head?.receiptId !== receiptId) return false
      state.queue.shift()
      return true
    },
  }
  const registry = createReceiverRegistry({
    provider,
    startReceiver: (options) => createReceiverLoop({ ...options, provider }),
  })
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
    state.sends.push({ chatId, message })
    await wait(state.sendDelay)
    if (state.unknown) return { kind: OUTCOME_UNKNOWN }
    return { kind: OK, idMessage: `${SEND_ID_PREFIX}${state.sends.length}` }
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
        idMessage: `${INCOMING_ID_PREFIX}${state.receipt + 1}`,
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
    registry.shutdown()
    state.queue = []
    state.sends = []
    state.deletes = []
    state.receipt = 0
    state.sendDelay = SEND_DELAY_MS
    state.unknown = false
    state.claims = 0
  }
  return { context, registry, state, send, inject, reset }
}
const key = Symbol.for(KEY)
const processState = globalThis as typeof globalThis & {
  [key]?: ReturnType<typeof createFixture>
}
export const notificationFixture = (processState[key] ??= createFixture())
