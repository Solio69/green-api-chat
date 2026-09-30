import { expect, test } from '@playwright/test';
import { EMPTY_STRING } from '@/lib/ui/constants';
import { LOGIN_CONTRACT, ROUTES } from './constants';

const { HOME } = ROUTES;
const { HEADING, ID_LABEL, TOKEN_LABEL, REQUIRED_HINT, SUBMIT } =
  LOGIN_CONTRACT;

test('opens the login card with two required fields', async ({ page }) => {
  const response = await page.goto(HOME);

  expect(response?.ok()).toBe(true);
  await expect(
    page.getByRole('heading', { level: 1, name: HEADING, exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.locator('input')).toHaveCount(2);
  for (const label of [ID_LABEL, TOKEN_LABEL]) {
    await expect(page.getByLabel(label, { exact: true })).toBeVisible();
    await expect(page.getByLabel(label, { exact: true })).toHaveAttribute(
      'required',
      EMPTY_STRING,
    );
  }
  await expect(page.getByText(REQUIRED_HINT, { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: SUBMIT, exact: true }),
  ).toBeEnabled();
});
