import { expect, test } from '@playwright/test'
import type { Route } from '@playwright/test'
import type { MessageDTO } from '@/lib/messages/types'
import { TEST_UI } from '../constants'
import {
  HISTORY_TEST,
  MESSAGE_CACHE_TEST,
  HISTORY_WINDOW_TEST,
} from '../history/constants'

const {
  API,
  PROBE_PATH,
  BUTTON_OPEN_A,
  chatA,
  scopeA,
  message,
  SUCCESS,
  MESSAGE,
} = HISTORY_TEST
const { OUTGOING, READ, FAILED } = MESSAGE
const { ISSUES_OUTPUT, FAILURE_BUTTON } = MESSAGE_CACHE_TEST
const { ROLE_BUTTON } = TEST_UI
const {
  LIST_LABEL,
  LOADING,
  EMPTY_TITLE,
  ERROR_TITLE,
  RETRY,
  HTML_TEXT,
  OUTGOING_TEXT,
  OUTGOING_ID,
  UNSUPPORTED,
  HISTORY_ITEMS,
  OLD_ID_PREFIX,
  IMAGE_SELECTOR,
  SCROLL_POSITION,
  SCROLL_ROUNDS,
} = HISTORY_WINDOW_TEST
const { ROLE_LIST, ROLE_LIST_ITEM } = TEST_UI
const { STATUS, CODE, ERROR, BUTTON_CLOSE, MEDIA_ID } = HISTORY_TEST
const { UNAVAILABLE } = STATUS
const { UNAVAILABLE: SERVICE_UNAVAILABLE } = CODE
const { TEXT, UNSUPPORTED: UNSUPPORTED_KIND } = MESSAGE

test('history window: loading differs from successful empty response and failed retry preserves known messages', async ({
  page,
}) => {
  let pending: Route | undefined
  const reply = async (options: Parameters<Route['fulfill']>[0]) => {
    await expect.poll(() => pending !== undefined).toBe(true)
    const current = pending!
    pending = undefined
    await current.fulfill(options)
  }
  await page.route(API, (route) => {
    pending = route
  })
  await page.goto(PROBE_PATH)
  await page
    .getByRole(ROLE_BUTTON, { name: BUTTON_OPEN_A, exact: true })
    .click()
  await expect(page.getByText(LOADING, { exact: true })).toBeVisible()
  await reply({
    json: {
      status: SUCCESS,
      connectionScope: scopeA,
      chatId: chatA,
      messages: [],
    },
  })
  await expect(page.getByText(EMPTY_TITLE, { exact: true })).toBeVisible()
  await page
    .getByRole(ROLE_BUTTON, { name: BUTTON_OPEN_A, exact: true })
    .click()
  await expect(page.getByText(LOADING, { exact: true })).toBeVisible()
  await reply({
    status: UNAVAILABLE,
    json: { status: ERROR, code: SERVICE_UNAVAILABLE },
  })
  await expect(page.getByText(ERROR_TITLE, { exact: true })).toBeVisible()
  await expect(page.getByText(EMPTY_TITLE, { exact: true })).toHaveCount(0)
  await page.getByRole(ROLE_BUTTON, { name: RETRY, exact: true }).click()
  await reply({
    json: {
      status: SUCCESS,
      connectionScope: scopeA,
      chatId: chatA,
      messages: [message],
    },
  })
  await expect(page.getByText(message.text, { exact: true })).toBeVisible()
  await page
    .getByRole(ROLE_BUTTON, { name: BUTTON_OPEN_A, exact: true })
    .click()
  await reply({
    status: UNAVAILABLE,
    json: { status: ERROR, code: SERVICE_UNAVAILABLE },
  })
  await expect(page.getByText(ERROR_TITLE, { exact: true })).toBeVisible()
  await expect(page.getByText(message.text, { exact: true })).toBeVisible()
})
test('history window: safe literal text, unsupported and accumulated messages use one request per access without scroll fetch', async ({
  page,
}) => {
  let calls = 0
  const old: MessageDTO[] = Array.from(
    { length: HISTORY_ITEMS },
    (_, index) => ({
      ...message,
      idMessage: `${OLD_ID_PREFIX}${index}`,
      timestamp: index,
    }),
  )
  const outgoing: MessageDTO = {
    ...message,
    idMessage: OUTGOING_ID,
    text: OUTGOING_TEXT,
    direction: OUTGOING,
    timestamp: 200,
  }
  const unsupported: MessageDTO = {
    ...outgoing,
    idMessage: MEDIA_ID,
    kind: UNSUPPORTED_KIND,
    text: null,
    timestamp: 201,
  }
  const html: MessageDTO = {
    ...message,
    text: HTML_TEXT,
    kind: TEXT,
    timestamp: 100,
  }
  await page.route(API, (route) => {
    calls += 1
    return route.fulfill({
      json: {
        status: SUCCESS,
        connectionScope: scopeA,
        chatId: chatA,
        messages: calls === 1 ? old : [html, outgoing, unsupported],
      },
    })
  })
  await page.goto(PROBE_PATH)
  const open = page.getByRole(ROLE_BUTTON, { name: BUTTON_OPEN_A, exact: true })
  await open.click()
  const list = page.getByRole(ROLE_LIST, { name: LIST_LABEL, exact: true })
  await expect(list.getByRole(ROLE_LIST_ITEM)).toHaveCount(HISTORY_ITEMS)
  await open.click()
  await expect(list.getByRole(ROLE_LIST_ITEM)).toHaveCount(HISTORY_ITEMS + 3)
  await expect(page.getByText(HTML_TEXT, { exact: true })).toBeVisible()
  await expect(page.getByText(OUTGOING_TEXT, { exact: true })).toBeVisible()
  await expect(page.getByText(UNSUPPORTED, { exact: true })).toBeVisible()
  await expect(list.locator(IMAGE_SELECTOR)).toHaveCount(0)
  await list.evaluate((element) => {
    element.scrollTop = 0
  })
  expect(calls).toBe(2)
  await page.getByRole(ROLE_BUTTON, { name: BUTTON_CLOSE, exact: true }).click()
  await expect(list).toHaveCount(0)
})

test('history window: guarded history consumer publishes a conflicting failure and retains read', async ({
  page,
}) => {
  let pending: Route | undefined
  await page.route(API, (route) => {
    pending = route
  })
  await page.goto(PROBE_PATH)
  await page
    .getByRole(ROLE_BUTTON, { name: BUTTON_OPEN_A, exact: true })
    .click()
  await expect.poll(() => pending !== undefined).toBe(true)
  await page
    .getByRole(ROLE_BUTTON, { name: FAILURE_BUTTON, exact: true })
    .click()
  await pending!.fulfill({
    json: {
      status: SUCCESS,
      connectionScope: scopeA,
      chatId: chatA,
      messages: [{ ...message, direction: OUTGOING, status: READ }],
    },
  })
  await expect(page.getByTestId(ISSUES_OUTPUT)).toHaveText(
    JSON.stringify([
      { chatId: chatA, idMessage: message.idMessage, code: FAILED },
    ]),
  )
})

test('history window: opening ends at bottom and refreshing while reading retains scroll position', async ({
  page,
}) => {
  let calls = 0
  await page.route(API, (route) => {
    const start = calls++ * HISTORY_ITEMS
    const messages = Array.from({ length: HISTORY_ITEMS }, (_, index) => ({
      ...message,
      idMessage: `${OLD_ID_PREFIX}${start + index}`,
      timestamp: start + index,
    }))
    return route.fulfill({
      json: {
        status: SUCCESS,
        connectionScope: scopeA,
        chatId: chatA,
        messages,
      },
    })
  })
  await page.goto(PROBE_PATH)
  const open = page.getByRole(ROLE_BUTTON, { name: BUTTON_OPEN_A, exact: true })
  const list = page.getByRole(ROLE_LIST, { name: LIST_LABEL, exact: true })
  for (let round = 1; round <= SCROLL_ROUNDS; round++) {
    await open.click()
    await expect(list.getByRole(ROLE_LIST_ITEM)).toHaveCount(
      round * HISTORY_ITEMS,
    )
  }
  await expect
    .poll(() =>
      list.evaluate(
        (element) =>
          element.scrollHeight - element.scrollTop - element.clientHeight,
      ),
    )
    .toBeLessThanOrEqual(2)
  await list.evaluate((element, position) => {
    element.scrollTop = position
  }, SCROLL_POSITION)
  await expect
    .poll(() => list.evaluate((element) => element.scrollTop))
    .toBe(SCROLL_POSITION)
  await open.click()
  await expect(list.getByRole(ROLE_LIST_ITEM)).toHaveCount(
    (SCROLL_ROUNDS + 1) * HISTORY_ITEMS,
  )
  expect(await list.evaluate((element) => element.scrollTop)).toBe(
    SCROLL_POSITION,
  )
  expect(calls).toBe(SCROLL_ROUNDS + 1)
})
