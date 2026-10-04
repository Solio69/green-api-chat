import type { Page, Route } from '@playwright/test'
import { expect, test } from './owner-fixture'
import type { MessageDTO } from '@/features/conversation/messages/model/types'
import { EMPTY_STRING } from '@/shared/kernel/ui/constants'
import { TEST_UI } from '../constants'
import { HISTORY_TEST, HISTORY_CONSOLE_TEST } from '../history/constants'

const {
  API,
  PROBE_PATH,
  FIRST,
  SECOND,
  BUTTON_OPEN_A,
  BUTTON_BACK,
  BUTTON_CLOSE,
  BUTTON_REFRESH,
  scopeA,
  SUCCESS,
  ERROR,
  message,
  SNAPSHOT,
  FAILURE,
  STATUS,
  CODE,
  NEW_MESSAGE_ID,
} = HISTORY_TEST
const { ROLE_BUTTON } = TEST_UI
const { MISSING_QUERY_FN } = HISTORY_CONSOLE_TEST
const captureLogs = (page: Page) => {
  const logs: string[] = []
  page.on('console', (event) => {
    const text = event.text()
    const relevant =
      text.startsWith(SNAPSHOT) ||
      text.startsWith(FAILURE) ||
      text.includes(MISSING_QUERY_FN)
    if (relevant) logs.push(text)
  })
  return logs
}
const fulfill = ({
  route,
  messages = [message],
  scope = scopeA,
}: {
  route: Route
  messages?: MessageDTO[]
  scope?: string
}) => {
  const { chatId } = route.request().postDataJSON() as { chatId: string }
  return route.fulfill({
    json: { status: SUCCESS, connectionScope: scope, chatId, messages },
  })
}
const state = async ({ page, id = FIRST }: { page: Page; id?: string }) =>
  JSON.parse((await page.getByTestId(id).textContent()) ?? EMPTY_STRING) as {
    data: MessageDTO[] | null
    pending: boolean
    fetching: boolean
    error: string | null
  }
test('history React: one request per access and retained merged cache without debug output', async ({
  page,
}) => {
  let calls = 0
  const latest: MessageDTO = {
    ...message,
    idMessage: NEW_MESSAGE_ID,
    timestamp: 200,
  }
  const replies = [[message], [latest], [], [latest]]
  const logs = captureLogs(page)
  await page.route(API, async (route) => {
    const messages = replies[calls] ?? []
    calls += 1
    await fulfill({ route, messages })
  })
  await page.goto(PROBE_PATH)
  await page
    .getByRole(ROLE_BUTTON, { name: BUTTON_OPEN_A, exact: true })
    .click()
  await expect.poll(() => calls).toBe(1)
  await expect.poll(async () => (await state({ page })).fetching).toBe(false)
  expect((await state({ page })).data).toEqual([message])
  expect(await state({ page, id: SECOND })).toEqual(await state({ page }))
  await page
    .getByRole(ROLE_BUTTON, { name: BUTTON_OPEN_A, exact: true })
    .click()
  await expect.poll(() => calls).toBe(2)
  await expect
    .poll(async () => (await state({ page })).data)
    .toEqual([message, latest])
  expect((await state({ page })).data).toEqual([message, latest])
  await page
    .getByRole(ROLE_BUTTON, { name: BUTTON_OPEN_A, exact: true })
    .click()
  await expect.poll(() => calls).toBe(3)
  await expect.poll(async () => (await state({ page })).fetching).toBe(false)
  expect((await state({ page })).data).toEqual([message, latest])
  await page.getByRole(ROLE_BUTTON, { name: BUTTON_BACK, exact: true }).click()
  expect(calls).toBe(3)
  await page.getByRole(ROLE_BUTTON, { name: BUTTON_CLOSE, exact: true }).click()
  await expect
    .poll(() => state({ page }))
    .toEqual({ data: null, pending: false, fetching: false, error: null })
  await page
    .getByRole(ROLE_BUTTON, { name: BUTTON_REFRESH, exact: true })
    .click()
  expect(calls).toBe(3)
  await page
    .getByRole(ROLE_BUTTON, { name: BUTTON_OPEN_A, exact: true })
    .click()
  await expect.poll(() => calls).toBe(4)
  expect(calls).toBe(4)
  expect(logs).toEqual([])
})
test('history React: error retains known messages and manual retry recovers without debug output', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date(0))
  let calls = 0
  const logs = captureLogs(page)
  await page.route(API, async (route) => {
    calls += 1
    if (calls === 2) {
      await route.fulfill({
        status: STATUS.UNAVAILABLE,
        json: { status: ERROR, code: CODE.UNAVAILABLE },
      })
      return
    }
    await fulfill({ route })
  })
  await page.goto(PROBE_PATH)
  await page
    .getByRole(ROLE_BUTTON, { name: BUTTON_OPEN_A, exact: true })
    .click()
  await expect.poll(async () => (await state({ page })).fetching).toBe(false)
  await page
    .getByRole(ROLE_BUTTON, { name: BUTTON_REFRESH, exact: true })
    .click()
  await expect.poll(() => calls).toBe(2)
  await expect
    .poll(async () => (await state({ page })).error)
    .toBe(CODE.UNAVAILABLE)
  expect((await state({ page })).data).toEqual([message])
  await page
    .getByRole(ROLE_BUTTON, { name: BUTTON_REFRESH, exact: true })
    .click()
  await expect.poll(() => calls).toBe(3)
  await expect.poll(async () => (await state({ page })).error).toBeNull()
  await page
    .getByRole(ROLE_BUTTON, { name: BUTTON_REFRESH, exact: true })
    .click()
  await expect.poll(() => calls).toBe(4)
  expect(calls).toBe(4)
  await expect.poll(async () => (await state({ page })).error).toBeNull()
  expect(logs).toEqual([])
})
