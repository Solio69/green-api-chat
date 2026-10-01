import { expect, test } from '@playwright/test'
import {
  CREDENTIALS,
  LOGIN_CONTRACT,
  RECIPIENT_CONTRACT,
  RECIPIENT_SCENARIOS,
  ROUTES,
} from '../constants'

const { ID, TOKEN } = CREDENTIALS
const { ID_LABEL, TOKEN_LABEL, SUBMIT: LOGIN_SUBMIT } = LOGIN_CONTRACT
const { PHONE_LABEL, SUBMIT, FOUND, PENDING } = RECIPIENT_CONTRACT
const { foundPhone } = RECIPIENT_SCENARIOS
const { LOGIN, HOME, RECIPIENT_SEARCH_API } = ROUTES

test('search UI: result label and inert write button preserve the request contract', async ({
  page,
}, testInfo) => {
  await page.goto(LOGIN)
  await page.getByLabel(ID_LABEL).fill(ID)
  await page.getByLabel(TOKEN_LABEL).fill(TOKEN)
  await page.getByRole('button', { name: LOGIN_SUBMIT, exact: true }).click()
  await expect(page).toHaveURL(HOME)
  let requests = 0
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === RECIPIENT_SEARCH_API) requests += 1
  })
  await page.route(RECIPIENT_SEARCH_API, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    await route.continue()
  })
  await page.getByLabel(PHONE_LABEL).fill(foundPhone)
  await page.getByRole('button', { name: SUBMIT, exact: true }).click()
  await expect(
    page.getByRole('status').filter({ hasText: PENDING }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: PENDING, exact: true }),
  ).toBeDisabled()
  await expect(page.getByText(FOUND, { exact: true })).toBeVisible()
  await expect(page.getByText(foundPhone, { exact: true })).toBeVisible()
  const write = page.getByRole('button', { name: 'Написать', exact: true })
  await write.focus()
  await write.press('Enter')
  await expect(page).toHaveURL(HOME)
  expect(requests).toBe(1)
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 800 })
      const box = await write.boundingBox()
      expect(box?.height).toBeGreaterThanOrEqual(44)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true)
      await page.screenshot({
        path: testInfo.outputPath(`search-${colorScheme}-${width}.png`),
        fullPage: true,
      })
    }
  }
  await page.getByLabel(PHONE_LABEL).fill('12025550123')
  await expect(write).toHaveCount(0)
  await page.unroute(RECIPIENT_SEARCH_API)
  await page.route(RECIPIENT_SEARCH_API, (route) =>
    route.fulfill({
      json: { status: 'ok', result: 'found', chatId: '10000001' },
    }),
  )
  await page.getByRole('button', { name: '@username', exact: true }).click()
  const longUsername = 'a'.repeat(32)
  await page.getByLabel('Telegram username', { exact: true }).fill(longUsername)
  await page.getByRole('button', { name: SUBMIT, exact: true }).click()
  await expect(
    page.getByText(`@${longUsername}`, { exact: true }),
  ).toBeVisible()
  await page.addStyleTag({ content: 'html { font-size: 200% }' })
  await page.setViewportSize({ width: 320, height: 800 })
  await expect(write).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({
    path: testInfo.outputPath('search-long-text-200.png'),
    fullPage: true,
  })
})
