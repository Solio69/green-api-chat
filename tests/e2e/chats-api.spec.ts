import { expect, test } from '@playwright/test'
import { addChatSession } from '../chats/helpers'
import { EMPTY_STRING } from '@/lib/ui/constants'
import { CHAT_FIXTURES } from '../chats/constants'
import {
  CHAT_HTTP_CONTRACT,
  LOGIN_API_CONTRACT,
  SESSION_CONTRACT,
} from '../constants'

const { credentials, chat, scopeB } = CHAT_FIXTURES
const {
  API,
  SCOPE_HEADER,
  CACHE_HEADER,
  SESSION_REQUIRED,
  OPTIONS_METHOD,
  OPTIONS_STATUS,
  METHOD_NOT_ALLOWED,
  ALLOW,
  UNAUTHORIZED_INSTANCE,
  UNAVAILABLE_INSTANCE,
} = CHAT_HTTP_CONTRACT
const {
  OK_STATUS,
  UNAUTHORIZED_STATUS,
  UNAVAILABLE_STATUS,
  CONFLICT_STATUS,
  RESPONSE_OK,
  RESPONSE_ERROR,
  SERVICE_UNAVAILABLE,
  CACHE_CONTROL_VALUE,
} = LOGIN_API_CONTRACT
const { COOKIE_NAME } = SESSION_CONTRACT
test('chats HTTP: no session and unsupported methods do not call provider', async ({
  request,
}) => {
  const result = await request.get(API)
  expect(result.status()).toBe(UNAUTHORIZED_STATUS)
  expect(await result.json()).toEqual({
    status: RESPONSE_ERROR,
    code: SESSION_REQUIRED,
  })
  expect(result.headers()[CACHE_HEADER]).toBe(CACHE_CONTROL_VALUE)
  expect((await request.post(API)).status()).toBe(METHOD_NOT_ALLOWED)
  const options = await request.fetch(API, { method: OPTIONS_METHOD })
  expect(options.status()).toBe(OPTIONS_STATUS)
  expect(options.headers().allow).toBe(ALLOW)
})
test('chats HTTP: safe real route result, HEAD, mismatch does not destroy session', async ({
  context,
  baseURL,
}) => {
  const scope = await addChatSession({
    context,
    baseURL: baseURL!,
    credentials,
  })
  const headers = { [SCOPE_HEADER]: scope }
  const result = await context.request.get(API, { headers })
  expect(result.status()).toBe(OK_STATUS)
  expect(await result.json()).toEqual({
    status: RESPONSE_OK,
    connectionScope: scope,
    chats: [chat],
  })
  expect(await result.text()).not.toContain(credentials.apiTokenInstance)
  expect(await result.text()).not.toContain(credentials.idInstance)
  const head = await context.request.head(API, { headers })
  expect(head.status()).toBe(OK_STATUS)
  expect(await head.text()).toBe(EMPTY_STRING)
  const mismatch = await context.request.get(API, {
    headers: { [SCOPE_HEADER]: scopeB },
  })
  expect(mismatch.status()).toBe(CONFLICT_STATUS)
  expect((await context.request.get(API, { headers })).status()).toBe(OK_STATUS)
})
for (const [id, status, code, cleared] of [
  [UNAUTHORIZED_INSTANCE, UNAUTHORIZED_STATUS, SESSION_REQUIRED, true],
  [UNAVAILABLE_INSTANCE, UNAVAILABLE_STATUS, SERVICE_UNAVAILABLE, false],
] as const) {
  test(`chats HTTP: cookie on provider ${status}`, async ({
    context,
    baseURL,
  }) => {
    const scope = await addChatSession({
      context,
      baseURL: baseURL!,
      credentials: { ...credentials, idInstance: id },
    })
    const response = await context.request.get(API, {
      headers: { [SCOPE_HEADER]: scope },
    })
    expect(response.status()).toBe(status)
    expect(await response.json()).toEqual({ status: RESPONSE_ERROR, code })
    expect(
      (await context.cookies()).some(({ name }) => name === COOKIE_NAME),
    ).toBe(!cleared)
  })
}
