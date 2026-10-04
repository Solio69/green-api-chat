import type { Page } from '@playwright/test'
import { expect, test } from './owner-fixture'
import { MESSAGING_UI_TEST } from '../notifications/ui-constants'
import { EMPTY_STRING } from '@/shared/kernel/ui/constants'
import { TEST_UI } from '../constants'
import { HISTORY_TEST } from '../history/constants'
import { TEST_API_RESPONSE, TEST_API_ROUTES } from '../protocol.constants'

const BROWSER_POLLING_TEST = {
  RETRY: 'Подключиться снова',
  LOCKS: 'locks',
  UNSUPPORTED:
    'Браузер не поддерживает работу с единственной вкладкой. Откройте приложение в современном браузере по HTTPS.',
} as const
const { RETRY, LOCKS, UNSUPPORTED } = BROWSER_POLLING_TEST
const { PATH, CONTROL_API, OPEN_A, LABEL, TEXT, SEND, LIMIT } =
  MESSAGING_UI_TEST
const { API, scopeA } = HISTORY_TEST
const { OK } = TEST_API_RESPONSE
const { CHATS } = TEST_API_ROUTES
const { ROLE_BUTTON, ROLE_TEXTBOX } = TEST_UI
const openConversation = async (page: Page) => {
  await page.getByRole(ROLE_BUTTON, { name: OPEN_A, exact: true }).click()
  await page.getByRole(ROLE_TEXTBOX, { name: LABEL, exact: true }).fill(TEXT)
  await expect(
    page.getByRole(ROLE_BUTTON, { name: SEND, exact: true }),
  ).toBeEnabled()
}
const prepare = async (page: Page) => {
  await page.route(API, (route) =>
    route.fulfill({
      json: {
        status: OK,
        connectionScope: scopeA,
        chatId: route.request().postDataJSON().chatId,
        messages: [],
      },
    }),
  )
  await page.route(CHATS, (route) =>
    route.fulfill({ json: { status: OK, connectionScope: scopeA, chats: [] } }),
  )
}
test.beforeEach(async ({ page }) => {
  await prepare(page)
})
test('browser Web Lock blocks second tab and transfers after first closes without a server release', async ({
  page,
  context,
}) => {
  await page.goto(PATH)
  await openConversation(page)
  const second = await context.newPage()
  await prepare(second)
  await second.goto(PATH)
  await expect(second.getByText(LIMIT, { exact: true })).toBeVisible()
  await page.close()
  await second.getByRole(ROLE_BUTTON, { name: RETRY, exact: true }).click()
  await expect(second.getByText(LIMIT, { exact: true })).toHaveCount(0)
  await openConversation(second)
  await second.getByRole(ROLE_BUTTON, { name: SEND, exact: true }).click()
  await expect(
    second.getByRole(ROLE_TEXTBOX, { name: LABEL, exact: true }),
  ).toHaveValue(EMPTY_STRING)
})
test('reload reacquires browser lease without the old server ownership grace', async ({
  page,
}) => {
  await page.goto(PATH)
  await openConversation(page)
  await page.reload()
  await openConversation(page)
  await expect(page.getByText(LIMIT, { exact: true })).toHaveCount(0)
})
test('unsupported Web Locks shows explicit limitation instead of reading queue', async ({
  page,
  request,
}) => {
  await page.addInitScript(
    (property) =>
      Object.defineProperty(navigator, property, {
        configurable: true,
        value: undefined,
      }),
    LOCKS,
  )
  await page.goto(PATH)
  await expect(page.getByText(UNSUPPORTED, { exact: true })).toBeVisible()
  expect((await (await request.get(CONTROL_API)).json()).claims).toBe(0)
})
