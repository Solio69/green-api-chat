import type { Page } from '@playwright/test'
import { expect, test } from './owner-fixture'
import {
  CONVERSATION_CONTRACT,
  CONVERSATION_FIXTURES,
  LOGIN_API_CONTRACT,
  QUERY_PROBE_CONTRACT,
  RECIPIENT_API_CONTRACT,
  RECIPIENT_CONTRACT,
  ROUTE_PATTERNS,
  SELECTION_PROBE_IDS,
  TEST_UI,
} from '../constants'
import { CHAT_LIST_UI } from '../e2e/chat-list-ui.constants'

const { targetA, targetB, newChatId, phone } = CONVERSATION_FIXTURES
const { FIRST } = SELECTION_PROBE_IDS
const { API: CHATS_API, SCOPE_HEADER, LIST } = CHAT_LIST_UI
const { RESPONSE_OK } = LOGIN_API_CONTRACT
const { RESULT_FOUND } = RECIPIENT_API_CONTRACT
const { PHONE_LABEL, SUBMIT, WRITE } = RECIPIENT_CONTRACT
const { RECIPIENT_SEARCH_API } = ROUTE_PATTERNS
const { SELECTION_URL } = QUERY_PROBE_CONTRACT
const { SELECTION_API_PATTERN } = CONVERSATION_CONTRACT
const { ROLE_BUTTON, ROLE_LIST, ROLE_LIST_ITEM, EVENT_REQUEST } = TEST_UI

const selection = (page: Page) => page.getByTestId(FIRST)
const expectSelection = ({
  page,
  expected,
}: {
  page: Page
  expected: Record<string, unknown>
}) =>
  expect
    .poll(async () => JSON.parse(await selection(page).innerText()))
    .toMatchObject(expected)

const prepare = async (page: Page) => {
  await page.route(CHATS_API, (route) =>
    route.fulfill({
      json: {
        status: RESPONSE_OK,
        connectionScope: route.request().headers()[SCOPE_HEADER],
        chats: [targetA, targetB].map(({ chatId, label }) => ({
          chatId,
          name: label,
          username: null,
          phone: null,
        })),
      },
    }),
  )
  await page.goto(SELECTION_URL)
  await expect(page.getByRole(ROLE_LIST, { name: LIST })).toBeVisible()
}

test('selection Context: found recipient opens without another lookup, Send or list entry', async ({
  page,
}) => {
  let lookups = 0
  const unexpected: string[] = []
  page.on(EVENT_REQUEST, (request) => {
    if (SELECTION_API_PATTERN.test(request.url()))
      unexpected.push(request.url())
  })
  await page.route(RECIPIENT_SEARCH_API, (route) => {
    lookups += 1
    return route.fulfill({
      json: { status: RESPONSE_OK, result: RESULT_FOUND, chatId: newChatId },
    })
  })
  await prepare(page)
  await page.getByLabel(PHONE_LABEL).fill(phone)
  await page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }).click()
  await page.getByRole(ROLE_BUTTON, { name: WRITE, exact: true }).click()
  await expectSelection({ page, expected: { target: { chatId: newChatId } } })
  await expect(page.getByRole(ROLE_LIST_ITEM)).toHaveCount(2)
  expect(lookups).toBe(1)
  expect(unexpected).toEqual([])
})
