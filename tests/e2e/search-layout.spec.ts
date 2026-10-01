import { expect, test } from '@playwright/test'
import { CREDENTIALS, LOGIN_CONTRACT, ROUTES } from '../constants'

const { ID, TOKEN } = CREDENTIALS
const { ID_LABEL, TOKEN_LABEL, SUBMIT } = LOGIN_CONTRACT
const { LOGIN, HOME } = ROUTES

test('search layout keeps mode height and scales the workspace with the viewport', async ({
  page,
}, testInfo) => {
  await page.goto(LOGIN)
  await page.getByLabel(ID_LABEL).fill(ID)
  await page.getByLabel(TOKEN_LABEL).fill(TOKEN)
  await page.getByRole('button', { name: SUBMIT, exact: true }).click()
  await expect(page).toHaveURL(HOME)
  const search = page.locator('section').filter({
    has: page.getByRole('heading', { name: 'Поиск получателя', exact: true }),
  })
  let requests = 0
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/recipients/search')
      requests += 1
  })
  for (const scale of [100, 200]) {
    const style = await page.addStyleTag({
      content: `html { font-size: ${scale}% }`,
    })
    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme })
      for (const width of [320, 390, 1280, 1440, 1920, 2560]) {
        await page.setViewportSize({ width, height: 900 })
        await page.getByRole('button', { name: 'Телефон', exact: true }).click()
        const phoneBox = await search.boundingBox()
        await page
          .getByRole('button', { name: '@username', exact: true })
          .click()
        await expect(
          page.getByText('Можно вводить с @ или без него', { exact: true }),
        ).toBeVisible()
        await expect(
          page.getByText('Введите номер с кодом страны, только цифры.', {
            exact: true,
          }),
        ).toBeHidden()
        await expect(
          page.getByLabel('Telegram username', { exact: true }),
        ).toHaveAccessibleDescription('Можно вводить с @ или без него')
        const usernameBox = await search.boundingBox()
        expect(
          Math.abs((phoneBox?.height ?? 0) - (usernameBox?.height ?? 0)),
        ).toBeLessThanOrEqual(1)
        await page.getByRole('button', { name: 'Телефон', exact: true }).click()
        const restoredBox = await search.boundingBox()
        expect(restoredBox?.height).toBe(phoneBox?.height)
        const geometry = await page.evaluate(() => {
          const main = document.querySelector('main')?.getBoundingClientRect()
          const body = getComputedStyle(document.body)
          return {
            width: main?.width ?? 0,
            left: main?.left ?? 0,
            gutter: parseFloat(body.paddingLeft),
            overflows: document.documentElement.scrollWidth > innerWidth,
            viewport: innerWidth,
          }
        })
        expect(geometry.overflows).toBe(false)
        expect(Math.abs(geometry.left - geometry.gutter)).toBeLessThanOrEqual(1)
        expect(
          Math.abs(geometry.width - (geometry.viewport - 2 * geometry.gutter)),
        ).toBeLessThanOrEqual(1)
      }
    }
    await style.evaluate((element) => element.parentNode?.removeChild(element))
  }
  expect(requests).toBe(0)
  await page.setViewportSize({ width: 1920, height: 900 })
  await page.emulateMedia({ colorScheme: 'light' })
  await page.getByRole('button', { name: '@username', exact: true }).click()
  await page.screenshot({
    path: testInfo.outputPath('workspace-wide.png'),
    fullPage: true,
  })
})
