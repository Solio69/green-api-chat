import scenarios from './scenarios.json' with { type: 'json' }

const HOST = 'https://4100.api.green-api.com'
const INSTANCE_PATH = /^\/waInstance[^/]+\/([^/]+)\/[^/]+$/
const STATE_METHOD = 'getStateInstance'
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
}
const {
  OK,
  BAD_REQUEST,
  UNAUTHORIZED,
  SERVICE_UNAVAILABLE,
  UNEXPECTED_METHOD,
} = HTTP_STATUS
const originalFetch = globalThis.fetch

const response = (body: unknown, status = OK): Response =>
  Response.json(body, { status })

const fakeGreenApiFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> => {
  const requestUrl = input instanceof Request ? input.url : String(input)
  const url = new URL(requestUrl)
  if (url.origin !== HOST) return originalFetch(input, init)

  const method = INSTANCE_PATH.exec(url.pathname)?.[1]
  if (method === STATE_METHOD) return response({ stateInstance: AUTHORIZED })
  if (method !== SEARCH_METHOD) return response({}, UNEXPECTED_METHOD)

  const rawBody = init?.body ?? EMPTY_BODY
  if (typeof rawBody !== 'string') return response({}, BAD_REQUEST)

  let body: unknown
  try {
    body = JSON.parse(rawBody)
  } catch {
    return response({}, BAD_REQUEST)
  }

  if (!body || typeof body !== 'object' || Array.isArray(body))
    return response({}, BAD_REQUEST)

  const { phoneNumber, username } = body as Record<string, unknown>
  if (phoneNumber === Number(scenarios.foundPhone))
    return response({ exist: true, chatId: scenarios.chatId })
  if (phoneNumber === Number(scenarios.missingPhone))
    return response({ exist: false })
  if (username === `@${scenarios.foundUsername}`)
    return response({ exist: true, chatId: scenarios.chatId })
  if (username === `@${scenarios.missingUsername}`)
    return response({ exist: false })
  if (username === `@${scenarios.rateLimitedUsername}`)
    return response({ status: false, data: { reason: RATE_LIMIT_REASON } })
  if (username === `@${scenarios.unauthorizedUsername}`)
    return response({}, UNAUTHORIZED)
  if (username === `@${scenarios.unavailableUsername}`)
    return response({}, SERVICE_UNAVAILABLE)
  if (username === `@${scenarios.delayedUsername}`) {
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS))
    return response({ exist: true, chatId: scenarios.chatId })
  }
  return response({ exist: false })
}

globalThis.fetch = fakeGreenApiFetch
