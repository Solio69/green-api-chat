import { expect, test } from '@playwright/test'
import type { Page, Route } from '@playwright/test'
import { BROWSER_EVENTS, EMPTY_STRING } from '@/lib/ui/constants'
import { CHAT_FIXTURES } from '../chats/constants'
import {
  CONVERSATION_CONTRACT,
  LOGIN_API_CONTRACT,
  QUERY_PROBE_CONTRACT,
  QUERY_PROBE_COPY,
  QUERY_PROBE_IDS,
  RECIPIENT_API_CONTRACT,
  TEST_UI,
} from '../constants'
import { CHAT_LIST_UI } from '../e2e/chat-list-ui.constants'

const { scopeA, chat } = CHAT_FIXTURES
const {
  LIST,
  ERROR,
  API,
  SCOPE_HEADER,
  REFRESH: RETRY,
  RETRY_PENDING,
} = CHAT_LIST_UI
const { FIRST, SECOND } = QUERY_PROBE_IDS
const { CONSUMERS, SWITCH_ACCOUNT, LOGOUT, STRICT_MODE, RENDER } =
  QUERY_PROBE_COPY
const {
  HOME,
  LOGOUT_ROUTE,
  LOGOUT_ERROR,
  LOGIN_PATTERN,
  HOME_PATTERN,
  OLD_ACCOUNT_LABEL,
  CONNECTION_CHANGED,
  RSC_HEADER,
  RSC_HEADER_VALUE,
  STALE_DELAY_MS,
  GC_DELAY_MS,
} = QUERY_PROBE_CONTRACT
const {
  OK_STATUS,
  UNAVAILABLE_STATUS,
  UNAUTHORIZED_STATUS,
  CONFLICT_STATUS,
  RESPONSE_OK,
  RESPONSE_ERROR,
  SERVICE_UNAVAILABLE,
} = LOGIN_API_CONTRACT
const { BACK: CHATS_HEADING } = CONVERSATION_CONTRACT
const {
  ROLE_BUTTON,
  ROLE_REGION,
  ROLE_LIST,
  ROLE_LIST_ITEM,
  ROLE_ALERT,
  QUERY_OUTPUT_SELECTOR,
  EVENT_REQUEST,
} = TEST_UI
const { FOCUS } = BROWSER_EVENTS
const { SESSION_REQUIRED } = RECIPIENT_API_CONTRACT

const fulfill = ({
  route,
  chats = [chat],
  status = OK_STATUS,
  code,
}: {
  route: Route
  chats?: unknown[]
  status?: number
  code?: string
}) =>
  route.fulfill({
    status,
    json: code
      ? { status: RESPONSE_ERROR, code }
      : {
          status: RESPONSE_OK,
          connectionScope: route.request().headers()[SCOPE_HEADER],
          chats,
        },
  })
const first = (page: Page) =>
  page.getByTestId(FIRST).locator(QUERY_OUTPUT_SELECTOR)
const second = (page: Page) =>
  page.getByTestId(SECOND).locator(QUERY_OUTPUT_SELECTOR)
const expectState = ({
  page,
  expected,
}: {
  page: Page
  expected: Record<string, unknown>
}) =>
  expect
    .poll(async () => JSON.parse(await first(page).innerText()))
    .toMatchObject(expected)

test('React query: two consumers, fresh remount and API recovery on reload', async ({
  page,
}) => {
  let calls = 0
  let pending: Route | undefined
  await page.route(API, async (route) => {
    calls += 1
    pending = route
  })
  await page.goto(HOME)
  await expectState({ page, expected: { isPending: true } })
  await expect.poll(() => calls).toBe(1)
  await fulfill({ route: pending! })
  await expect(first(page)).toContainText(chat.chatId)
  await expect(second(page)).toContainText(chat.chatId)
  await page.getByRole(ROLE_BUTTON, { name: CONSUMERS }).click()
  await page.getByRole(ROLE_BUTTON, { name: CONSUMERS }).click()
  await expect(first(page)).toContainText(chat.chatId)
  expect(calls).toBe(1)
  await page.reload()
  await expect.poll(() => calls).toBe(2)
  await expectState({ page, expected: { isPending: true } })
  await fulfill({ route: pending! })
  await expect(first(page)).toContainText(chat.chatId)
})

test('React query: empty success differs from loading', async ({ page }) => {
  await page.route(API, (route) => fulfill({ route, chats: [] }))
  await page.goto(HOME)
  await expectState({ page, expected: { data: [], isPending: false } })
})

test('React query: background refresh/error retain cache while UI shows recovery', async ({
  page,
}) => {
  let calls = 0
  let pending: Route | undefined
  await page.route(API, (route) => {
    calls += 1
    if (calls === 1) return fulfill({ route })
    pending = route
  })
  await page.goto(HOME)
  const area = page.getByRole(ROLE_REGION, { name: CHATS_HEADING, exact: true })
  const list = area.getByRole(ROLE_LIST, { name: LIST })
  await expect(first(page)).toContainText(chat.chatId)
  await expect(list.getByRole(ROLE_LIST_ITEM)).toHaveCount(1)
  await expect(area.getByRole(ROLE_BUTTON)).toHaveCount(1)
  await page.getByTestId(FIRST).getByRole(ROLE_BUTTON).click()
  await expectState({ page, expected: { isFetching: true } })
  await expect(list.getByRole(ROLE_LIST_ITEM)).toHaveCount(1)
  await fulfill({
    route: pending!,
    status: UNAVAILABLE_STATUS,
    code: SERVICE_UNAVAILABLE,
  })
  await expectState({ page, expected: { error: SERVICE_UNAVAILABLE } })
  await expect(first(page)).toContainText(chat.chatId)
  await expect(area.getByRole(ROLE_ALERT)).toContainText(ERROR)
  await expect(list.getByRole(ROLE_LIST_ITEM)).toHaveCount(1)
  const retry = area.getByRole(ROLE_BUTTON, { name: RETRY, exact: true })
  await retry.click()
  await expect.poll(() => calls).toBe(3)
  await expectState({ page, expected: { isFetching: true } })
  await expect(first(page)).toContainText(chat.chatId)
  await expect(area.getByRole(ROLE_ALERT)).toContainText(ERROR)
  await expect(
    area.getByRole(ROLE_BUTTON, { name: RETRY_PENDING, exact: true }),
  ).toBeDisabled()
  await expect(list.getByRole(ROLE_LIST_ITEM)).toHaveCount(1)
  await fulfill({ route: pending! })
  await expectState({ page, expected: { error: null } })
  await expect(list.getByRole(ROLE_LIST_ITEM)).toHaveCount(1)
  await expect(area.getByRole(ROLE_ALERT)).toHaveCount(0)
  await expect(area.getByRole(ROLE_BUTTON)).toHaveCount(1)
})

test('React query: switching account rejects late data of old scope', async ({
  page,
}) => {
  let old: Route | undefined
  await page.route(API, (route) => {
    if (route.request().headers()[SCOPE_HEADER] === scopeA) {
      old = route
      return
    }
    return fulfill({ route, chats: [{ ...chat, name: SWITCH_ACCOUNT }] })
  })
  await page.goto(HOME)
  await expect.poll(() => !!old).toBe(true)
  await page.getByRole(ROLE_BUTTON, { name: SWITCH_ACCOUNT }).click()
  await expect(first(page)).toContainText(SWITCH_ACCOUNT)
  await fulfill({
    route: old!,
    chats: [{ ...chat, name: OLD_ACCOUNT_LABEL }],
  }).catch(() => undefined)
  await expect(first(page)).not.toContainText(OLD_ACCOUNT_LABEL)
})

test('React query: failed logout preserves cache, successful logout navigates', async ({
  page,
}) => {
  await page.route(API, (route) => fulfill({ route }))
  let fails = true
  await page.route(LOGOUT_ROUTE, (route) =>
    route.fulfill({
      status: fails ? UNAVAILABLE_STATUS : OK_STATUS,
      body: EMPTY_STRING,
    }),
  )
  await page.goto(HOME)
  await expect(first(page)).toContainText(chat.chatId)
  await page.getByRole(ROLE_BUTTON, { name: LOGOUT }).click()
  await expect(page.getByText(LOGOUT_ERROR)).toBeVisible()
  await expect(first(page)).toContainText(chat.chatId)
  fails = false
  await page.getByRole(ROLE_BUTTON, { name: LOGOUT }).click()
  await expect(page).toHaveURL(LOGIN_PATTERN)
})

test('React query: expiry closes and navigates', async ({ page }) => {
  await page.route(API, (route) =>
    fulfill({ route, status: UNAUTHORIZED_STATUS, code: SESSION_REQUIRED }),
  )
  await page.goto(HOME)
  await expect(page).toHaveURL(LOGIN_PATTERN)
})

test('React query: production wrapper remount and rerender preserve visible data', async ({
  page,
}) => {
  let calls = 0
  await page.route(API, (route) => {
    calls += 1
    return fulfill({ route })
  })
  await page.goto(HOME)
  await expect(first(page)).toContainText(chat.chatId)
  await page.getByRole(ROLE_BUTTON, { name: STRICT_MODE }).click()
  await expect(first(page)).toContainText(chat.chatId)
  await page.getByRole(ROLE_BUTTON, { name: RENDER, exact: false }).click()
  await expect(first(page)).toContainText(chat.chatId)
  expect(calls).toBeLessThanOrEqual(2)
})

test('React query: stale remount and inactive GC use clock, no polling/focus requests', async ({
  page,
}) => {
  await page.clock.install()
  let calls = 0
  await page.route(API, (route) => {
    calls += 1
    return fulfill({ route })
  })
  await page.goto(HOME)
  await expect(first(page)).toContainText(chat.chatId)
  await page.clock.runFor(STALE_DELAY_MS)
  expect(calls).toBe(1)
  await page.evaluate(
    (eventName) => window.dispatchEvent(new Event(eventName)),
    FOCUS,
  )
  expect(calls).toBe(1)
  await page.getByRole(ROLE_BUTTON, { name: CONSUMERS }).click()
  await page.getByRole(ROLE_BUTTON, { name: CONSUMERS }).click()
  await expect.poll(() => calls).toBe(2)
  await page.getByRole(ROLE_BUTTON, { name: CONSUMERS }).click()
  await page.clock.runFor(GC_DELAY_MS)
  await page.getByRole(ROLE_BUTTON, { name: CONSUMERS }).click()
  await expect.poll(() => calls).toBe(3)
})

test('React query: 409 closes both consumers and refreshes once without login', async ({
  page,
}) => {
  let refreshes = 0
  let calls = 0
  page.on(EVENT_REQUEST, (request) => {
    if (request.headers()[RSC_HEADER] === RSC_HEADER_VALUE) refreshes += 1
  })
  await page.route(API, (route) => {
    calls += 1
    return fulfill({ route, status: CONFLICT_STATUS, code: CONNECTION_CHANGED })
  })
  await page.goto(HOME)
  await expect.poll(() => refreshes).toBe(1)
  await expectState({ page, expected: { isPending: false } })
  await expect
    .poll(async () => JSON.parse(await second(page).innerText()))
    .toMatchObject({ isFetching: false })
  await expect(first(page)).not.toContainText(chat.chatId)
  await page.getByTestId(FIRST).getByRole(ROLE_BUTTON).click()
  expect(calls).toBe(1)
  await expect(page).toHaveURL(HOME_PATTERN)
})
