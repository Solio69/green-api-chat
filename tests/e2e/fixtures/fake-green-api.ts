import accountScenarios from './account-scenarios.json' with { type: 'json' }
import chatsScenarios from './chats-scenarios.json' with { type: 'json' }
import historyScenarios from './history-scenarios.json' with { type: 'json' }
import scenarios from './scenarios.json' with { type: 'json' }
import sendScenarios from './send-scenarios.json' with { type: 'json' }

const NOTIFICATION_FIXTURE = {
  ENABLED: 'yes',
  TELEGRAM: 'telegram',
  USER: 'user',
  STATUS: 'outgoingMessageStatus',
  INCOMING: 'incomingMessageReceived',
  TEXT_MESSAGE: 'textMessage',
  DELIVERED: 'delivered',
  READ: 'read',
  TIMESTAMP: 1_800_000_000,
  SENDER_LABEL: 'Тестовый собеседник',
  REPLY: 'Ответ тестового собеседника',
} as const
const {
  ENABLED,
  TELEGRAM,
  USER,
  STATUS,
  INCOMING,
  TEXT_MESSAGE,
  DELIVERED,
  READ,
  TIMESTAMP,
  SENDER_LABEL,
  REPLY,
} = NOTIFICATION_FIXTURE

const HOST = 'https://4100.api.green-api.com'
const PROVIDER_HOST = 'api.green-api.com'
const UNEXPECTED_PROVIDER_ORIGIN = 'Unexpected GREEN-API origin in E2E fixture'
const INSTANCE_PATH = /^\/waInstance([^/]+)\/([^/]+)\/[^/]+(?:\/(\d+))?$/
const STATE_METHOD = 'getStateInstance'
const ACCOUNT_METHOD = 'getAccountSettings'
const NOTIFICATION_SETTINGS_METHOD = 'getSettings'
const RECEIVE_METHOD = 'receiveNotification'
const DELETE_METHOD = 'deleteNotification'
const SEND_METHOD = 'sendMessage'
const RECEIVE_DELAY_MS = 50
const DELIVERY_DELAY_MS = 500
const READ_DELAY_MS = 1_000
const notificationHeads = new Map<
  string,
  { receiptId: number; body: object }[]
>()
const sendCounts = new Map<string, number>()
let notificationReceipt = 0
const enqueueNotification = ({ id, body }: { id: string; body: object }) => {
  notificationReceipt += 1
  const queue = notificationHeads.get(id) ?? []
  queue.push({
    receiptId: notificationReceipt,
    body: {
      instanceData: { idInstance: id, typeInstance: TELEGRAM },
      timestamp: TIMESTAMP,
      ...body,
    },
  })
  notificationHeads.set(id, queue)
}
const SEARCH_METHOD = 'checkAccount'
const HISTORY_METHOD = 'getChatHistory'
const CHATS_METHOD = 'getChats'
const HISTORY_CHAT_ID = 'history-chat-a'
const HISTORY_CHAT_LABEL = 'История А'
const HISTORY_COUNT = 10
const POST_METHOD = 'POST'
const AUTHORIZED = 'authorized'
const RATE_LIMIT_REASON = 'rate_limit_exceeded'
const DELAY_MS = 750
const EMPTY_BODY = '{}'
const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  SERVICE_UNAVAILABLE: 503,
  UNEXPECTED_METHOD: 500,
  RATE_LIMITED: 429,
}
const {
  OK,
  BAD_REQUEST,
  UNAUTHORIZED,
  SERVICE_UNAVAILABLE,
  UNEXPECTED_METHOD,
  RATE_LIMITED,
} = HTTP_STATUS
const originalFetch = globalThis.fetch
const stateCalls = new Map<string, number>()
const accountCalls = new Map<string, number>()
const ONE_STATE_CALL = 1
const DEFAULT_PROFILE = { username: '@connected_demo' }

const response = ({
  body,
  status = OK,
}: {
  body: unknown
  status?: number
}): Response => Response.json(body, { status })

const accountResponse = (id: string): Response => {
  const scenario = Object.values(accountScenarios).find(
    (item) => item.id === id,
  )
  if (!scenario)
    return response({
      body: { stateInstance: AUTHORIZED, ...DEFAULT_PROFILE },
    })
  if (stateCalls.get(id) !== ONE_STATE_CALL)
    return response({ body: {}, status: UNEXPECTED_METHOD })
  const calls = (accountCalls.get(id) ?? 0) + 1
  accountCalls.set(id, calls)
  if (id === accountScenarios.unauthorized.id)
    return response({ body: {}, status: UNAUTHORIZED })
  const isFirstTemporary = id === accountScenarios.temporary.id && calls === 1
  if (isFirstTemporary)
    return response({ body: {}, status: SERVICE_UNAVAILABLE })
  const isFirstRateLimit = id === accountScenarios.rateLimited.id && calls === 1
  if (isFirstRateLimit) return response({ body: {}, status: RATE_LIMITED })
  const isReplacement = id === accountScenarios.brokenAvatar.id && calls > 1
  let avatar: string | undefined
  if (isReplacement) avatar = accountScenarios.brokenAvatar.replacementAvatar
  else if ('avatar' in scenario) avatar = scenario.avatar
  return response({
    body: {
      stateInstance: AUTHORIZED,
      username: 'username' in scenario ? scenario.username : undefined,
      phone: 'phone' in scenario ? scenario.phone : undefined,
      avatar,
    },
  })
}

const fakeGreenApiFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> => {
  const requestUrl = input instanceof Request ? input.url : String(input)
  const url = new URL(requestUrl)
  if (url.origin !== HOST) {
    const isProviderHost =
      url.hostname === PROVIDER_HOST ||
      url.hostname.endsWith(`.${PROVIDER_HOST}`)
    if (isProviderHost) throw new Error(UNEXPECTED_PROVIDER_ORIGIN)
    return originalFetch(input, init)
  }

  const path = INSTANCE_PATH.exec(url.pathname)
  const id = path?.[1]
  const method = path?.[2]
  if (!id) return response({ body: {}, status: UNEXPECTED_METHOD })
  if (method === NOTIFICATION_SETTINGS_METHOD)
    return response({
      body: {
        typeInstance: TELEGRAM,
        webhookUrl: '',
        incomingWebhook: ENABLED,
        outgoingMessageWebhook: ENABLED,
        outgoingAPIMessageWebhook: ENABLED,
        outgoingWebhook: ENABLED,
      },
    })
  if (method === RECEIVE_METHOD) {
    await new Promise((resolve) => setTimeout(resolve, RECEIVE_DELAY_MS))
    init?.signal?.throwIfAborted()
    return response({ body: notificationHeads.get(id)?.[0] ?? null })
  }
  if (method === DELETE_METHOD) {
    const queue = notificationHeads.get(id)
    const matching = queue?.[0]?.receiptId === Number(path?.[3])
    if (matching) queue?.shift()
    return response({ body: { result: matching, reason: '' } })
  }
  if (method === SEND_METHOD) {
    if (id === sendScenarios.unknown.id)
      throw new Error('Fictional send network failure')
    if (id === sendScenarios.rejected.id)
      return response({
        body: { message: 'validation failed' },
        status: BAD_REQUEST,
      })
    const payload = JSON.parse(
      typeof init?.body === 'string' ? init.body : EMPTY_BODY,
    )
    const count = (sendCounts.get(id) ?? 0) + 1
    sendCounts.set(id, count)
    const idMessage = `e2e-send-${count}`
    setTimeout(
      () =>
        enqueueNotification({
          id,
          body: {
            typeWebhook: STATUS,
            chatId: payload.chatId,
            idMessage,
            status: DELIVERED,
          },
        }),
      DELIVERY_DELAY_MS,
    )
    setTimeout(() => {
      enqueueNotification({
        id,
        body: {
          typeWebhook: STATUS,
          chatId: payload.chatId,
          idMessage,
          status: READ,
        },
      })
      enqueueNotification({
        id,
        body: {
          typeWebhook: INCOMING,
          idMessage: `e2e-reply-${count}`,
          senderData: {
            chatId: payload.chatId,
            chatType: USER,
            senderName: SENDER_LABEL,
          },
          messageData: {
            typeMessage: TEXT_MESSAGE,
            textMessageData: { textMessage: REPLY },
          },
        },
      })
    }, READ_DELAY_MS)
    return response({ body: { idMessage } })
  }
  const sendingFixture = Object.values(sendScenarios).some(
    (scenario) => scenario.id === id,
  )
  if (sendingFixture && method === HISTORY_METHOD) return response({ body: [] })
  if (method === STATE_METHOD) {
    const calls = (stateCalls.get(id) ?? 0) + 1
    stateCalls.set(id, calls)
    const isBudgetExceeded =
      Object.values(accountScenarios).some((item) => item.id === id) &&
      calls > ONE_STATE_CALL
    if (isBudgetExceeded)
      return response({ body: {}, status: UNEXPECTED_METHOD })
    return response({ body: { stateInstance: AUTHORIZED } })
  }
  if (method === HISTORY_METHOD) {
    let payload: unknown
    try {
      payload = JSON.parse(
        typeof init?.body === 'string' ? init.body : EMPTY_BODY,
      )
    } catch {
      return response({ body: {}, status: BAD_REQUEST })
    }
    const valid =
      init?.method === POST_METHOD &&
      payload !== null &&
      typeof payload === 'object' &&
      'chatId' in payload &&
      payload.chatId === HISTORY_CHAT_ID &&
      'count' in payload &&
      payload.count === HISTORY_COUNT
    if (!valid) return response({ body: {}, status: BAD_REQUEST })
    const scenario = Object.entries(historyScenarios).find(
      ([key]) => key === id,
    )?.[1]
    if (!scenario) return response({ body: [] })
    return response({
      body: scenario.body,
      status: 'status' in scenario ? scenario.status : OK,
    })
  }
  if (method === CHATS_METHOD) {
    if (Object.hasOwn(historyScenarios, id))
      return response({
        body: [
          { chatId: HISTORY_CHAT_ID, type: USER, name: HISTORY_CHAT_LABEL },
        ],
      })
    const scenario = Object.entries(chatsScenarios).find(
      ([key]) => key === id,
    )?.[1]
    if (!scenario) return response({ body: [] })
    return response({
      body: scenario.body,
      status: 'status' in scenario ? scenario.status : OK,
    })
  }
  if (method === ACCOUNT_METHOD) return accountResponse(id)
  if (method !== SEARCH_METHOD)
    return response({ body: {}, status: UNEXPECTED_METHOD })

  const rawBody = init?.body ?? EMPTY_BODY
  if (typeof rawBody !== 'string')
    return response({ body: {}, status: BAD_REQUEST })

  let body: unknown
  try {
    body = JSON.parse(rawBody)
  } catch {
    return response({ body: {}, status: BAD_REQUEST })
  }

  const payload = body
  const isInvalidBody =
    !payload || typeof payload !== 'object' || Array.isArray(payload)
  if (isInvalidBody) return response({ body: {}, status: BAD_REQUEST })

  const phoneNumber = 'phoneNumber' in payload ? payload.phoneNumber : undefined
  const username = 'username' in payload ? payload.username : undefined
  if (phoneNumber === Number(scenarios.foundPhone))
    return response({ body: { exist: true, chatId: scenarios.chatId } })
  if (phoneNumber === Number(scenarios.missingPhone))
    return response({ body: { exist: false } })
  if (username === `@${scenarios.foundUsername}`)
    return response({ body: { exist: true, chatId: scenarios.chatId } })
  if (username === `@${scenarios.missingUsername}`)
    return response({ body: { exist: false } })
  if (username === `@${scenarios.rateLimitedUsername}`)
    return response({
      body: { status: false, data: { reason: RATE_LIMIT_REASON } },
    })
  if (username === `@${scenarios.unauthorizedUsername}`)
    return response({ body: {}, status: UNAUTHORIZED })
  if (username === `@${scenarios.unavailableUsername}`)
    return response({ body: {}, status: SERVICE_UNAVAILABLE })
  if (username === `@${scenarios.delayedUsername}`) {
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS))
    return response({ body: { exist: true, chatId: scenarios.chatId } })
  }
  return response({ body: { exist: false } })
}

globalThis.fetch = fakeGreenApiFetch
