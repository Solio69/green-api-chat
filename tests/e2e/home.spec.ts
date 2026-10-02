import { expect, test } from './owner-fixture'
import { EMPTY_STRING } from '@/lib/ui/constants'
import { LOGIN_CONTRACT, ROUTES, TEST_UI } from '../constants'

const { HOME, LOGIN } = ROUTES
const { HEADING, ID_LABEL, TOKEN_LABEL, REQUIRED_HINT, SUBMIT } = LOGIN_CONTRACT
const {
  ROLE_HEADING,
  ROLE_BUTTON,
  INPUT_SELECTOR,
  OUTPUT_SELECTOR,
  ATTR_REQUIRED,
} = TEST_UI

test('opens the login card with two required fields', async ({ page }) => {
  const response = await page.goto(LOGIN)

  expect(response?.ok()).toBe(true)
  await expect(
    page.getByRole(ROLE_HEADING, { level: 1, name: HEADING, exact: true }),
  ).toBeVisible()
  await expect(page.getByRole(ROLE_HEADING, { level: 1 })).toHaveCount(1)
  await expect(page.locator(INPUT_SELECTOR)).toHaveCount(2)
  for (const label of [ID_LABEL, TOKEN_LABEL]) {
    await expect(page.getByLabel(label, { exact: true })).toBeVisible()
    await expect(page.getByLabel(label, { exact: true })).toHaveAttribute(
      ATTR_REQUIRED,
      EMPTY_STRING,
    )
  }
  await expect(page.getByText(REQUIRED_HINT, { exact: true })).toBeVisible()
  await expect(
    page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }),
  ).toBeEnabled()
})

test('redirects a visitor without a session to login', async ({ page }) => {
  await page.goto(HOME)
  await expect(page).toHaveURL(LOGIN)
  await expect(page.locator(OUTPUT_SELECTOR)).toHaveCount(0)
})
