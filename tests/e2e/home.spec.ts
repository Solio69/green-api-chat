import { expect, test } from '@playwright/test';

import { PAGE, ROUTES } from './constants';

const { HEADING } = PAGE;
const { HOME } = ROUTES;

test('shows the foundation page', async ({ page }) => {
  const response = await page.goto(HOME);

  expect(response).not.toBeNull();
  expect(response?.ok()).toBe(true);
  await expect(
    page.getByRole('heading', { level: 1, name: HEADING, exact: true }),
  ).toBeVisible();
});
