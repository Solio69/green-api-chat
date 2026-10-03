import type { Page } from '@playwright/test'
import { expect, test } from './owner-fixture'
import { EMPTY_STRING } from '@/lib/ui/constants'
import {
  CONVERSATION_CONTRACT,
  CONVERSATION_FIXTURES,
  LOGIN_API_CONTRACT,
  QUERY_PROBE_CONTRACT,
  RECIPIENT_API_CONTRACT,
  RECIPIENT_CONTRACT,
  ROUTE_PATTERNS,
  SELECTION_PROBE_COPY,
  SELECTION_PROBE_IDS,
  TEST_UI,
} from '../constants'
import { CHAT_LIST_UI } from '../e2e/chat-list-ui.constants'

const { targetA, targetB, newChatId, phone, knownMessage, draftA, draftB } =
  CONVERSATION_FIXTURES
const { FIRST, SECOND, CACHE, HISTORY_TARGET } = SELECTION_PROBE_IDS
const {
  OPEN,
  BACK,
  CLOSE,
  SEED_MESSAGES,
  INSPECT_MESSAGES,
  END_SESSION,
  SWITCH_SCOPE,
  HISTORY_PENDING,
  HISTORY_EMPTY,
  HISTORY_ERROR,
  HISTORY_KNOWN,
  HISTORY_LATE,
  EDITOR,
  EMPTY_REPLY,
  ERROR_REPLY,
  KNOWN_REPLY,
  LATE_REPLY,
} = SELECTION_PROBE_COPY
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

test('selection Context: StrictMode click is one access, both consumers share A → A → B', async ({
  page,
}) => {
  await prepare(page)
  await page.getByRole(ROLE_BUTTON, { name: OPEN, exact: true }).click()
  await expectSelection({ page, expected: { accessId: 1 } })
  await expect(page.getByTestId(SECOND)).toHaveText(
    await selection(page).innerText(),
  )
  await page
    .getByRole(ROLE_BUTTON, { name: targetA.label, exact: true })
    .click()
  await expectSelection({ page, expected: { accessId: 2, selectionEpoch: 1 } })
  await page
    .getByRole(ROLE_BUTTON, { name: targetB.label, exact: true })
    .click()
  await expectSelection({
    page,
    expected: { target: { chatId: targetB.chatId }, selectionEpoch: 2 },
  })
})

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

test('selection Context: close preserves Query data, closed session hides and guards selection', async ({
  page,
}) => {
  await prepare(page)
  await page.getByRole(ROLE_BUTTON, { name: OPEN }).click()
  await page.getByRole(ROLE_BUTTON, { name: SEED_MESSAGES }).click()
  await page.getByRole(ROLE_BUTTON, { name: BACK }).click()
  await expectSelection({ page, expected: { selectionEpoch: 1 } })
  await page.getByRole(ROLE_BUTTON, { name: CLOSE }).click()
  await expectSelection({ page, expected: { selectionEpoch: 2 } })
  await page.getByRole(ROLE_BUTTON, { name: INSPECT_MESSAGES }).click()
  await expect(page.getByTestId(CACHE)).toContainText(knownMessage)
  await page.getByRole(ROLE_BUTTON, { name: END_SESSION }).click()
  await page.getByRole(ROLE_BUTTON, { name: OPEN }).click()
  await expectSelection({ page, expected: { target: null } })
  await page.getByRole(ROLE_BUTTON, { name: SWITCH_SCOPE }).click()
  await expectSelection({ page, expected: { accessId: 0 } })
  await page.getByRole(ROLE_BUTTON, { name: OPEN }).click()
  await expectSelection({ page, expected: { accessId: 1 } })
})

test('selection slots: pending/empty/error differ, access and editor epoch are independent', async ({
  page,
}) => {
  await prepare(page)
  await page.getByRole(ROLE_BUTTON, { name: OPEN }).click()
  await expect
    .poll(async () =>
      JSON.parse(await page.getByTestId(HISTORY_TARGET).innerText()),
    )
    .toMatchObject({ chatId: targetA.chatId })
  await expect(page.getByText(HISTORY_PENDING, { exact: true })).toBeVisible()
  await page.getByRole(ROLE_BUTTON, { name: EMPTY_REPLY }).click()
  await expect(page.getByText(HISTORY_EMPTY, { exact: true })).toBeVisible()
  await page.getByRole(ROLE_BUTTON, { name: ERROR_REPLY }).click()
  await expect(page.getByText(HISTORY_ERROR, { exact: true })).toBeVisible()
  await page.getByRole(ROLE_BUTTON, { name: KNOWN_REPLY }).click()
  await expect(page.getByText(HISTORY_KNOWN, { exact: true })).toBeVisible()
  const editor = page.getByLabel(EDITOR)
  await editor.fill(draftA)
  await page.getByRole(ROLE_BUTTON, { name: OPEN }).click()
  await expect(editor).toHaveValue(draftA)
  await page.getByRole(ROLE_BUTTON, { name: BACK }).click()
  await expect(editor).toHaveValue(draftA)
  await page.getByRole(ROLE_BUTTON, { name: LATE_REPLY }).click()
  await page
    .getByRole(ROLE_BUTTON, { name: targetB.label, exact: true })
    .click()
  await expect(editor).toHaveValue(EMPTY_STRING)
  await editor.fill(draftB)
  await expect(page.getByText(HISTORY_LATE, { exact: true })).toBeVisible()
  await expectSelection({
    page,
    expected: { target: { chatId: targetB.chatId } },
  })
  await expect(editor).toHaveValue(draftB)
  await page.getByRole(ROLE_BUTTON, { name: CLOSE }).click()
  await page.getByRole(ROLE_BUTTON, { name: OPEN }).click()
  await expect(editor).toHaveValue(EMPTY_STRING)
})
