import { expect, test } from '@playwright/test'
import {
  CONVERSATION_CONTRACT,
  CONVERSATION_FIXTURES,
  CREDENTIALS,
  LOGIN_CONTRACT,
  RECIPIENT_CONTRACT,
  ROUTES,
  TEST_UI,
} from '../constants'

const { ID, TOKEN } = CREDENTIALS
const { ID_LABEL, TOKEN_LABEL, SUBMIT } = LOGIN_CONTRACT
const { SEARCH_HEADING, PHONE_LABEL } = RECIPIENT_CONTRACT
const { LOGIN, HOME } = ROUTES
const { BACK, PANE_LABEL, EMPTY_HEADING } = CONVERSATION_CONTRACT
const {
  phone,
  widths,
  viewportHeight,
  mobileBreakpoint,
  enlargedTextStyle,
  enlargedWorkspaceWidths,
} = CONVERSATION_FIXTURES
const { ROLE_BUTTON, ROLE_HEADING, ROLE_REGION } = TEST_UI

test('workspace: mobile hides empty pane and resize preserves the search', async ({
  page,
}, testInfo) => {
  await page.goto(LOGIN)
  await page.getByLabel(ID_LABEL).fill(ID)
  await page.getByLabel(TOKEN_LABEL).fill(TOKEN)
  await page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }).click()
  await expect(page).toHaveURL(HOME)
  const field = page.getByLabel(PHONE_LABEL)
  await field.fill(phone)
  for (const width of widths) {
    await page.setViewportSize({ width, height: viewportHeight })
    await expect(field).toHaveValue(phone)
    await expect(
      page.getByRole(ROLE_HEADING, { name: SEARCH_HEADING }),
    ).toBeVisible()
    await expect(
      page.getByRole(ROLE_HEADING, { name: BACK, exact: true }),
    ).toBeVisible()
    const pane = page.getByRole(ROLE_REGION, {
      name: PANE_LABEL,
      includeHidden: true,
    })
    if (width <= mobileBreakpoint) await expect(pane).toBeHidden()
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
  await page.addStyleTag({ content: enlargedTextStyle })
  for (const width of enlargedWorkspaceWidths) {
    await page.setViewportSize({ width, height: viewportHeight })
    await expect(field).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
    if (width > mobileBreakpoint) {
      const heading = await page
        .getByRole(ROLE_HEADING, { name: EMPTY_HEADING })
        .boundingBox()
      const pane = await page
        .getByRole(ROLE_REGION, { name: PANE_LABEL })
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
