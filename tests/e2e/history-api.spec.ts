import { expect, test } from './owner-fixture'
import { addChatSession } from '../chats/helpers'
import { HTTP_HEADERS } from '@/shared/kernel/http/constants'
import { ROUTES } from '@/shared/kernel/routes/constants'
import { EMPTY_STRING } from '@/shared/kernel/ui/constants'
import { TEST_UI } from '../constants'
import { HISTORY_TEST, HISTORY_CONSOLE_TEST } from '../history/constants'

const {
  API,
  METHOD,
  SUCCESS,
  ERROR,
  credentials,
  chatA,
  scopeB,
  message,
  STATUS,
  CODE,
  NO_STORE,
  SNAPSHOT,
  CACHE_HEADER,
  INVALID_ORIGINS,
  COOKIE_NAME,
  COUNT,
  HTTP,
  INSTANCES,
  JSON_KEYS,
  MEDIA_ID,
  TARGET_A,
  MESSAGE,
} = HISTORY_TEST
const { ROLE_BUTTON } = TEST_UI
const { MISSING_QUERY_FN } = HISTORY_CONSOLE_TEST
const { ORIGIN: ORIGIN_HEADER, CONNECTION_SCOPE: REQUEST_SCOPE_HEADER } =
  HTTP_HEADERS
const {
  OK,
  BAD_REQUEST,
  UNAUTHORIZED,
  FORBIDDEN,
  CONFLICT,
  BAD_GATEWAY,
  UNAVAILABLE,
} = STATUS
const { SESSION, INVALID, CHANGED, UPSTREAM } = CODE
test('history HTTP: missing session and unsupported methods never read upstream history', async ({
  request,
  baseURL,
}) => {
  const response = await request.post(API, {
    headers: { [ORIGIN_HEADER]: baseURL! },
    data: { chatId: chatA },
  })
  expect(response.status()).toBe(UNAUTHORIZED)
  expect(await response.json()).toEqual({ status: ERROR, code: SESSION })
  expect(response.headers()[CACHE_HEADER]).toBe(NO_STORE)
  expect((await request.get(API)).status()).toBe(HTTP.UNSUPPORTED_STATUS)
  expect((await request.head(API)).status()).toBe(HTTP.UNSUPPORTED_STATUS)
  const options = await request.fetch(API, {
    method: HTTP.OPTIONS,
  })
  expect(options.status()).toBe(HTTP.OPTIONS_STATUS)
  expect(options.headers().allow).toBe(HTTP.ALLOW)
})
test('history HTTP: real cookie route returns safe normalized data and validates scope and Origin', async ({
  context,
  baseURL,
}) => {
  const scope = await addChatSession({
    context,
    baseURL: baseURL!,
    credentials,
  })
  const headers = { [REQUEST_SCOPE_HEADER]: scope, [ORIGIN_HEADER]: baseURL! }
  const response = await context.request.post(API, {
    headers,
    data: { chatId: chatA },
  })
  expect(response.status()).toBe(OK)
  expect(response.headers()[CACHE_HEADER]).toBe(NO_STORE)
  expect(await response.json()).toEqual({
    status: SUCCESS,
    connectionScope: scope,
    chatId: chatA,
    messages: [
      message,
      {
        ...message,
        idMessage: MEDIA_ID,
        direction: MESSAGE.OUTGOING,
        kind: MESSAGE.UNSUPPORTED,
        text: null,
        timestamp: 200,
        status: MESSAGE.READ,
      },
    ],
  })
  const text = await response.text()
  expect(text).not.toContain(credentials.apiTokenInstance)
  expect(text).not.toContain(credentials.idInstance)
  expect(text).not.toContain(JSON_KEYS.DOWNLOAD_URL)
  expect(text).not.toContain(JSON_KEYS.SENDER_PHONE)
  for (const origin of INVALID_ORIGINS) {
    const response = await context.request.post(API, {
      headers: {
        [REQUEST_SCOPE_HEADER]: scope,
        ...(origin ? { [ORIGIN_HEADER]: origin } : {}),
      },
      data: { chatId: chatA },
    })
    expect(response.status()).toBe(FORBIDDEN)
    expect(await response.json()).toEqual({ status: ERROR, code: INVALID })
  }
  const mismatch = await context.request.post(API, {
    headers: { ...headers, [REQUEST_SCOPE_HEADER]: scopeB },
    data: { chatId: chatA },
  })
  expect(mismatch.status()).toBe(CONFLICT)
  expect(await mismatch.json()).toEqual({ status: ERROR, code: CHANGED })
  expect(
    (
      await context.request.post(API, {
        headers,
        data: { chatId: chatA, count: COUNT },
      })
    ).status(),
  ).toBe(BAD_REQUEST)
  expect(
    (
      await context.request.post(API, { headers, data: { chatId: chatA } })
    ).status(),
  ).toBe(OK)
})
for (const [id, status, code, cleared] of [
  [INSTANCES.UNAUTHORIZED, UNAUTHORIZED, SESSION, true],
  [INSTANCES.UNAVAILABLE, UNAVAILABLE, CODE.UNAVAILABLE, false],
  [INSTANCES.INVALID, BAD_GATEWAY, UPSTREAM, false],
] as const) {
  test(`history HTTP: provider ${status} preserves the specified cookie lifecycle`, async ({
    context,
    baseURL,
  }) => {
    const scope = await addChatSession({
      context,
      baseURL: baseURL!,
      credentials: { ...credentials, idInstance: id },
    })
    const response = await context.request.fetch(API, {
      method: METHOD,
      headers: { [REQUEST_SCOPE_HEADER]: scope, [ORIGIN_HEADER]: baseURL! },
      data: { chatId: chatA },
    })
    expect(response.status()).toBe(status)
    expect(await response.json()).toEqual({ status: ERROR, code })
    expect(
      (await context.cookies()).some(({ name }) => name === COOKIE_NAME),
    ).toBe(!cleared)
  })
}
test('history HTTP: successful empty response is explicit', async ({
  context,
  baseURL,
}) => {
  const scope = await addChatSession({
    context,
    baseURL: baseURL!,
    credentials: { ...credentials, idInstance: INSTANCES.EMPTY },
  })
  const response = await context.request.post(API, {
    headers: { [REQUEST_SCOPE_HEADER]: scope, [ORIGIN_HEADER]: baseURL! },
    data: { chatId: chatA },
  })
  expect(response.status()).toBe(OK)
  expect(await response.json()).toEqual({
    status: SUCCESS,
    connectionScope: scope,
    chatId: chatA,
    messages: [],
  })
  expect(EMPTY_STRING).toBe(await (await context.request.head(API)).text())
})
test('history UI: fresh requests render messages without history debug logs', async ({
  page,
  context,
  baseURL,
}) => {
  await addChatSession({ context, baseURL: baseURL!, credentials })
  const logs: string[] = []
  page.on('console', (event) => {
    const text = event.text()
    const relevant =
      text.startsWith(SNAPSHOT) || text.includes(MISSING_QUERY_FN)
    if (relevant) logs.push(text)
  })
  await page.goto(ROUTES.HOME)
  const firstResponse = page.waitForResponse(API)
  await page
    .getByRole(ROLE_BUTTON, { name: TARGET_A.label, exact: true })
    .click()
  await firstResponse
  await expect(page.getByText(message.text, { exact: true })).toBeVisible()
  expect(logs).toEqual([])
  const nextResponse = page.waitForResponse(API)
  await page
    .getByRole(ROLE_BUTTON, { name: TARGET_A.label, exact: true })
    .click()
  await nextResponse
  await expect(page.getByText(message.text, { exact: true })).toBeVisible()
  expect(logs).toEqual([])
})
