import accountScenarios from './account-scenarios.json' with { type: 'json' }
import chatsScenarios from './chats-scenarios.json' with { type: 'json' }
import scenarios from './scenarios.json' with { type: 'json' }

const HOST = 'https://4100.api.green-api.com'
const INSTANCE_PATH = /^\/waInstance([^/]+)\/([^/]+)\/[^/]+$/
const STATE_METHOD = 'getStateInstance'
const ACCOUNT_METHOD = 'getAccountSettings'
const SEARCH_METHOD = 'checkAccount'
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
  if (url.origin !== HOST) return originalFetch(input, init)

  const path = INSTANCE_PATH.exec(url.pathname)
  const id = path?.[1]
  const method = path?.[2]
  if (!id) return response({ body: {}, status: UNEXPECTED_METHOD })
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
  if (method === 'getChats') {
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
