import { expect, test } from '@playwright/test'
import type { Page, Route } from '@playwright/test'
import { CHAT_FIXTURES } from '../chats/constants'
import { CHAT_LIST_UI } from '../e2e/chat-list-ui.constants'

const { scopeA, chat } = CHAT_FIXTURES
const { LIST, ERROR } = CHAT_LIST_UI
const fulfill = ({
  route,
  chats = [chat],
  status = 200,
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
      ? { status: 'error', code }
      : {
          status: 'ok',
          connectionScope: route.request().headers()['x-connection-scope'],
          chats,
        },
  })
const first = (page: Page) => page.getByTestId('first').locator('output')
const second = (page: Page) => page.getByTestId('second').locator('output')

test('React query: two consumers, fresh remount and API recovery on reload', async ({
  page,
}) => {
  let calls = 0
  let pending: Route | undefined
  await page.route('**/api/chats', async (route) => {
    calls += 1
    pending = route
  })
  await page.goto('/')
  await expect(first(page)).toContainText('"isPending":true')
  await expect.poll(() => calls).toBe(1)
  await fulfill({ route: pending! })
  await expect(first(page)).toContainText('chat-1')
  await expect(second(page)).toContainText('chat-1')
  await page.getByRole('button', { name: 'Потребители' }).click()
  await page.getByRole('button', { name: 'Потребители' }).click()
  await expect(first(page)).toContainText('chat-1')
  expect(calls).toBe(1)
  await page.reload()
  await expect.poll(() => calls).toBe(2)
  await expect(first(page)).toContainText('"isPending":true')
  await fulfill({ route: pending! })
  await expect(first(page)).toContainText('chat-1')
})
test('React query: empty success differs from loading', async ({ page }) => {
  await page.route('**/api/chats', (route) => fulfill({ route, chats: [] }))
  await page.goto('/')
  await expect(first(page)).toContainText('"data":[]')
  await expect(first(page)).toContainText('"isPending":false')
})
test('React query: background refresh/error retain cache while UI shows recovery', async ({
  page,
}) => {
  let calls = 0
  let pending: Route | undefined
  await page.route('**/api/chats', (route) => {
    calls += 1
    if (calls === 1) return fulfill({ route })
    pending = route
  })
  await page.goto('/')
  const area = page.getByRole('region', { name: 'Чаты', exact: true })
  const list = area.getByRole('list', { name: LIST })
  await expect(first(page)).toContainText('chat-1')
  await expect(list.getByRole('listitem')).toHaveCount(1)
  await expect(area.getByRole('button')).toHaveCount(0)
  await page.getByTestId('first').getByRole('button').click()
  await expect(first(page)).toContainText('"isFetching":true')
  await expect(list.getByRole('listitem')).toHaveCount(1)
  await fulfill({ route: pending!, status: 503, code: 'service_unavailable' })
  await expect(first(page)).toContainText('service_unavailable')
  await expect(first(page)).toContainText('chat-1')
  await expect(area.getByRole('alert')).toContainText(ERROR)
  await expect(list).toHaveCount(0)
  const retry = area.getByRole('button')
  await retry.click()
  await expect.poll(() => calls).toBe(3)
  await expect(first(page)).toContainText('"isFetching":true')
  await expect(first(page)).toContainText('chat-1')
  await expect(area.getByRole('alert')).toContainText(ERROR)
  await expect(retry).toBeDisabled()
  await expect(list).toHaveCount(0)
  await fulfill({ route: pending! })
  await expect(first(page)).toContainText('"error":null')
  await expect(list.getByRole('listitem')).toHaveCount(1)
  await expect(area.getByRole('alert')).toHaveCount(0)
  await expect(area.getByRole('button')).toHaveCount(0)
})
test('React query: switching account rejects late data of old scope', async ({
  page,
}) => {
  let old: Route | undefined
  await page.route('**/api/chats', (route) => {
    if (route.request().headers()['x-connection-scope'] === scopeA) {
      old = route
      return
    }
    return fulfill({ route, chats: [{ ...chat, name: 'Аккаунт Б' }] })
  })
  await page.goto('/')
  await expect.poll(() => !!old).toBe(true)
  await page.getByRole('button', { name: 'Аккаунт Б' }).click()
  await expect(first(page)).toContainText('Аккаунт Б')
  await fulfill({
    route: old!,
    chats: [{ ...chat, name: 'OLD ACCOUNT' }],
  }).catch(() => undefined)
  await expect(first(page)).not.toContainText('OLD ACCOUNT')
})
test('React query: failed logout preserves cache, successful logout navigates', async ({
  page,
}) => {
  await page.route('**/api/chats', (route) => fulfill({ route }))
  let fails = true
  await page.route('**/api/auth/logout', (route) =>
    route.fulfill({ status: fails ? 503 : 200, body: '' }),
  )
  await page.goto('/')
  await expect(first(page)).toContainText('chat-1')
  await page.getByRole('button', { name: 'Выйти' }).click()
  await expect(
    page.getByText('Не удалось выйти. Попробуйте ещё раз.'),
  ).toBeVisible()
  await expect(first(page)).toContainText('chat-1')
  fails = false
  await page.getByRole('button', { name: 'Выйти' }).click()
  await expect(page).toHaveURL(/\/login$/)
})
test('React query: expiry closes and navigates', async ({ page }) => {
  await page.route('**/api/chats', (route) =>
    fulfill({ route, status: 401, code: 'session_required' }),
  )
  await page.goto('/')
  await expect(page).toHaveURL(/\/login$/)
})
test('React query: StrictMode replay and rerender preserve one client', async ({
  page,
}) => {
  let calls = 0
  await page.route('**/api/chats', (route) => {
    calls += 1
    return fulfill({ route })
  })
  await page.goto('/')
  await expect(first(page)).toContainText('chat-1')
  await page.getByRole('button', { name: 'Strict Mode' }).click()
  await expect(first(page)).toContainText('chat-1')
  await page.getByRole('button', { name: /Render/ }).click()
  await expect(first(page)).toContainText('chat-1')
  expect(calls).toBeLessThanOrEqual(2)
})
test('React query: stale remount and inactive GC use clock, no polling/focus requests', async ({
  page,
}) => {
  await page.clock.install()
  let calls = 0
  await page.route('**/api/chats', (route) => {
    calls += 1
    return fulfill({ route })
  })
  await page.goto('/')
  await expect(first(page)).toContainText('chat-1')
  await page.clock.runFor(60_001)
  expect(calls).toBe(1)
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  expect(calls).toBe(1)
  await page.getByRole('button', { name: 'Потребители' }).click()
  await page.getByRole('button', { name: 'Потребители' }).click()
  await expect.poll(() => calls).toBe(2)
  await page.getByRole('button', { name: 'Потребители' }).click()
  await page.clock.runFor(300_001)
  await page.getByRole('button', { name: 'Потребители' }).click()
  await expect.poll(() => calls).toBe(3)
})

test('React query: 409 closes both consumers and refreshes once without login', async ({
  page,
}) => {
  let refreshes = 0
  let calls = 0
  page.on('request', (request) => {
    if (request.headers().rsc === '1') refreshes += 1
  })
  await page.route('**/api/chats', (route) => {
    calls += 1
    return fulfill({ route, status: 409, code: 'connection_changed' })
  })
  await page.goto('/')
  await expect.poll(() => refreshes).toBe(1)
  await expect(first(page)).toContainText('"isPending":false')
  await expect(second(page)).toContainText('"isFetching":false')
  await expect(first(page)).not.toContainText('chat-1')
  await page.getByTestId('first').getByRole('button').click()
  expect(calls).toBe(1)
  await expect(page).toHaveURL(/\/$/)
})
