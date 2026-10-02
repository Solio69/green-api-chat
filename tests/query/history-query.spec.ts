import { expect, test } from '@playwright/test'
import type { Page, Route } from '@playwright/test'
import type { MessageDTO } from '@/lib/messages/types'
import { EMPTY_STRING } from '@/lib/ui/constants'
import { TEST_UI } from '../constants'
import { HISTORY_TEST } from '../history/constants'

const {
  API,
  PROBE_PATH,
  FIRST,
  SECOND,
  BUTTON_OPEN_A,
  BUTTON_OPEN_B,
  BUTTON_BACK,
  BUTTON_CLOSE,
  BUTTON_END,
  BUTTON_REFRESH,
  BUTTON_SCOPE,
  scopeA,
  scopeB,
  chatA,
  SUCCESS,
  ERROR,
  message,
  SNAPSHOT,
  FAILURE,
  STATUS,
  CODE,
  CURRENT_MESSAGE_ID,
  HTTP,
  NEW_MESSAGE_ID,
} = HISTORY_TEST
const { ROLE_BUTTON } = TEST_UI
type CapturedResult = {
  chatId: string
  count: number
  messages?: MessageDTO[]
  code?: string
}
const captureLogs = (page: Page) => {
  const logs: { label: string; value: CapturedResult }[] = []
  page.on('console', async (event) => {
    const args = event.args()
    const label = await args[0]?.jsonValue()
    const relevant = label === SNAPSHOT || label === FAILURE
    if (!relevant) return
    logs.push({ label, value: (await args[1].jsonValue()) as CapturedResult })
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
test('history React: one request per access, fresh console snapshot and retained merged cache', async ({
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
  await expect.poll(() => logs.length).toBe(1)
  expect((await state({ page })).data).toEqual([message])
  expect(await state({ page, id: SECOND })).toEqual(await state({ page }))
  await page
    .getByRole(ROLE_BUTTON, { name: BUTTON_OPEN_A, exact: true })
    .click()
  await expect.poll(() => logs.length).toBe(2)
  expect(logs[1].value.messages).toEqual([latest])
  expect((await state({ page })).data).toEqual([message, latest])
  await page
    .getByRole(ROLE_BUTTON, { name: BUTTON_OPEN_A, exact: true })
    .click()
  await expect.poll(() => logs.length).toBe(3)
  expect(logs[2].value.messages).toEqual([])
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
  await expect.poll(() => logs.length).toBe(4)
  expect(calls).toBe(4)
})
test('history React: A to B to A discards the earlier completion', async ({
  page,
}) => {
  const routes: Route[] = []
  const logs = captureLogs(page)
  await page.route(API, (route) => {
    routes.push(route)
  })
  await page.goto(PROBE_PATH)
  const openA = page.getByRole(ROLE_BUTTON, {
    name: BUTTON_OPEN_A,
    exact: true,
  })
  await openA.click()
  await expect.poll(() => routes.length).toBe(1)
  await page
    .getByRole(ROLE_BUTTON, { name: BUTTON_OPEN_B, exact: true })
    .click()
  await expect.poll(() => routes.length).toBe(2)
  await openA.click()
  await expect.poll(() => routes.length).toBe(3)
  const current = {
    ...message,
    idMessage: CURRENT_MESSAGE_ID,
    timestamp: 300,
  }
  await fulfill({ route: routes[2], messages: [current] })
  await expect.poll(() => logs.length).toBe(1)
  await fulfill({ route: routes[0] })
  await fulfill({ route: routes[1], messages: [] })
  expect(logs[0].value.messages).toEqual([current])
  expect((await state({ page })).data).toEqual([current])
  expect(logs).toHaveLength(1)
})
test('history React: error retains known messages, manual retry logs identical successful JSON again', async ({
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
  await expect.poll(() => logs.length).toBe(1)
  await page
    .getByRole(ROLE_BUTTON, { name: BUTTON_REFRESH, exact: true })
    .click()
  await expect.poll(() => logs.length).toBe(2)
  expect(logs[1]).toMatchObject({
    label: FAILURE,
    value: { chatId: chatA, code: CODE.UNAVAILABLE },
  })
  expect((await state({ page })).data).toEqual([message])
  await page
    .getByRole(ROLE_BUTTON, { name: BUTTON_REFRESH, exact: true })
    .click()
  await expect.poll(() => logs.length).toBe(3)
  expect(logs[2].value.messages).toEqual([message])
  await page
    .getByRole(ROLE_BUTTON, { name: BUTTON_REFRESH, exact: true })
    .click()
  await expect.poll(() => logs.length).toBe(4)
  expect(calls).toBe(4)
  expect((await state({ page })).error).toBeNull()
})
test('history React: pending refresh is deduplicated, close suppresses its late result', async ({
  page,
}) => {
  const routes: Route[] = []
  const logs = captureLogs(page)
  await page.route(API, (route) => {
    routes.push(route)
  })
  await page.goto(PROBE_PATH)
  await page
    .getByRole(ROLE_BUTTON, { name: BUTTON_OPEN_A, exact: true })
    .click()
  await expect.poll(() => routes.length).toBe(1)
  await expect.poll(async () => (await state({ page })).pending).toBe(true)
  await page
    .getByRole(ROLE_BUTTON, { name: BUTTON_REFRESH, exact: true })
    .click()
  expect(routes).toHaveLength(1)
  await page.getByRole(ROLE_BUTTON, { name: BUTTON_CLOSE, exact: true }).click()
  await fulfill({ route: routes[0] })
  await expect
    .poll(() => state({ page }))
    .toEqual({ data: null, pending: false, fetching: false, error: null })
  expect(logs).toHaveLength(0)
})
test('history React: closed session rejects late data and new connection has independent history', async ({
  page,
}) => {
  const routes: Route[] = []
  const logs = captureLogs(page)
  await page.route(API, (route) => {
    routes.push(route)
  })
  await page.goto(PROBE_PATH)
  await page
    .getByRole(ROLE_BUTTON, { name: BUTTON_OPEN_A, exact: true })
    .click()
  await expect.poll(() => routes.length).toBe(1)
  await page.getByRole(ROLE_BUTTON, { name: BUTTON_END, exact: true }).click()
  await fulfill({ route: routes[0] })
  await expect
    .poll(() => state({ page }))
    .toEqual({ data: null, pending: false, fetching: false, error: null })
  expect(logs).toHaveLength(0)
  await page.getByRole(ROLE_BUTTON, { name: BUTTON_SCOPE, exact: true }).click()
  await page
    .getByRole(ROLE_BUTTON, { name: BUTTON_OPEN_A, exact: true })
    .click()
  await expect.poll(() => routes.length).toBe(2)
  expect(routes[1].request().headers()[HTTP.SCOPE_LOWERCASE]).toBe(scopeB)
  await fulfill({ route: routes[1], scope: scopeB, messages: [] })
  await expect.poll(() => logs.length).toBe(1)
  expect((await state({ page })).data).toEqual([])
})
