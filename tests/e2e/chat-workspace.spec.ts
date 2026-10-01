import { expect, test } from '@playwright/test'
import {
  CREDENTIALS,
  LOGIN_CONTRACT,
  RECIPIENT_CONTRACT,
  ROUTES,
} from '../constants'

const { ID, TOKEN } = CREDENTIALS
const { ID_LABEL, TOKEN_LABEL, SUBMIT } = LOGIN_CONTRACT
const { SEARCH_HEADING, PHONE_LABEL } = RECIPIENT_CONTRACT
const { LOGIN, HOME } = ROUTES

test('workspace: mobile hides empty pane and resize preserves the search', async ({
  page,
}, testInfo) => {
  await page.goto(LOGIN)
  await page.getByLabel(ID_LABEL).fill(ID)
  await page.getByLabel(TOKEN_LABEL).fill(TOKEN)
  await page.getByRole('button', { name: SUBMIT, exact: true }).click()
  await expect(page).toHaveURL(HOME)
  const field = page.getByLabel(PHONE_LABEL)
  await field.fill('12025550123')
  for (const width of [320, 360, 390, 680, 681, 768, 1280]) {
    await page.setViewportSize({ width, height: 800 })
    await expect(field).toHaveValue('12025550123')
    await expect(
      page.getByRole('heading', { name: SEARCH_HEADING }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Чаты', exact: true }),
    ).toBeVisible()
    const pane = page.getByRole('region', {
      name: 'Переписка',
      includeHidden: true,
    })
    if (width <= 680) await expect(pane).toBeHidden()
    else await expect(pane).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
    await page.screenshot({
      path: testInfo.outputPath(`workspace-${width}.png`),
      fullPage: true,
    })
  }
  await page.addStyleTag({ content: 'html { font-size: 200% }' })
  for (const width of [320, 768, 1280]) {
    await page.setViewportSize({ width, height: 800 })
    await expect(field).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
    if (width > 680) {
      const heading = await page
        .getByRole('heading', { name: 'Выберите чат' })
        .boundingBox()
      const pane = await page
        .getByRole('region', { name: 'Переписка' })
        .boundingBox()
      expect(heading!.x).toBeGreaterThanOrEqual(pane!.x)
      expect(heading!.x + heading!.width).toBeLessThanOrEqual(
        pane!.x + pane!.width,
      )
    }
    await page.screenshot({
      path: testInfo.outputPath(`workspace-text-200-${width}.png`),
      fullPage: true,
    })
  }
})
