import { expect, test } from '@playwright/test';
import { HTTP_STATUS } from '@/lib/http/constants';
import { EMPTY_STRING } from '@/lib/ui/constants';
import {
  BASE_URL,
  CREDENTIALS,
  HTML_CONTRACT,
  LOGIN_CONTRACT,
  MIN_TOUCH_TARGET_SIZE,
  ROUTES,
  VIEWPORTS,
  WHITESPACE_ONLY,
} from './constants';

const {
  HEADING,
  ID_LABEL,
  TOKEN_LABEL,
  SUBMIT,
  SHOW_TOKEN,
  HIDE_TOKEN,
  ID_ERROR,
  TOKEN_ERROR,
  HELP_QUESTION,
  CABINET_LABEL,
  CABINET_URL,
  NEW_TAB,
} = LOGIN_CONTRACT;
const { ID, TOKEN } = CREDENTIALS;
const { HOME } = ROUTES;
const {
  INPUT_TEXT,
  INPUT_PASSWORD,
  ARIA_LIVE_POLITE,
  LINK_TARGET_NEW_TAB,
  LINK_REL_EXTERNAL,
} = HTML_CONTRACT;
const { OK: HTTP_OK } = HTTP_STATUS;

test.beforeEach(async ({ page }) => {
  await page.goto(HOME);
  await expect(page.getByLabel(ID_LABEL, { exact: true })).toBeEnabled();
});

test('hides and reveals the exact token without submitting', async ({
  page,
}) => {
  const token = page.getByLabel(TOKEN_LABEL, { exact: true });
  await token.fill(TOKEN);
  await expect(token).toHaveAttribute('type', INPUT_PASSWORD);
  await page
    .getByRole('button', { name: SHOW_TOKEN, exact: true })
    .press('Enter');
  await expect(token).toHaveAttribute('type', INPUT_TEXT);
  await expect(token).toHaveValue(TOKEN);
  await page
    .getByRole('button', { name: HIDE_TOKEN, exact: true })
    .press('Space');
  await expect(token).toHaveAttribute('type', INPUT_PASSWORD);
  await expect(token).toHaveValue(TOKEN);
  await expect(page.getByText(ID_ERROR, { exact: true })).toHaveCount(0);
  await expect(page.getByText(TOKEN_ERROR, { exact: true })).toHaveCount(0);
});

test('places an accessible eye inside the token field without overlapping text', async ({
  page,
}) => {
  const token = page.getByLabel(TOKEN_LABEL, { exact: true });
  const toggle = page.getByRole('button', { name: SHOW_TOKEN, exact: true });
  await token.fill(TOKEN);
  await expect(toggle).toHaveText(EMPTY_STRING);
  await expect(toggle).toHaveAttribute('title', SHOW_TOKEN);
  await expect(toggle.locator('svg')).toBeVisible();
  await expect(toggle.locator('svg')).toHaveAttribute('aria-hidden', 'true');

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport);
    const inputBox = await token.boundingBox();
    const buttonBox = await toggle.boundingBox();
    if (!inputBox || !buttonBox)
      throw new Error('Missing token control geometry');
    expect(buttonBox.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
    expect(buttonBox.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
    expect(buttonBox.x).toBeGreaterThan(inputBox.x + inputBox.width / 2);
    expect(buttonBox.y).toBeGreaterThanOrEqual(inputBox.y);
    expect(buttonBox.x + buttonBox.width).toBeLessThanOrEqual(
      inputBox.x + inputBox.width,
    );
    expect(buttonBox.y + buttonBox.height).toBeLessThanOrEqual(
      inputBox.y + inputBox.height,
    );
    const padding = await token.evaluate((element) =>
      parseFloat(getComputedStyle(element).paddingInlineEnd),
    );
    expect(inputBox.x + inputBox.width - padding).toBeLessThanOrEqual(
      buttonBox.x,
    );
  }

  const hiddenIcon = await toggle.locator('svg').innerHTML();
  await toggle.click();
  const hide = page.getByRole('button', { name: HIDE_TOKEN, exact: true });
  await expect(hide).toHaveText(EMPTY_STRING);
  await expect(hide).toHaveAttribute('title', HIDE_TOKEN);
  expect(await hide.locator('svg').innerHTML()).not.toBe(hiddenIcon);
  await expect(token).toHaveAttribute('type', INPUT_TEXT);
  await expect(token).toHaveValue(TOKEN);
  await hide.click();
  expect(await toggle.locator('svg').innerHTML()).toBe(hiddenIcon);
  await expect(token).toHaveAttribute('type', INPUT_PASSWORD);
  await expect(token).toHaveValue(TOKEN);
  await expect(page.getByText(ID_ERROR, { exact: true })).toHaveCount(0);
});

test('shows errors after submit and updates them while editing', async ({
  page,
}) => {
  const id = page.getByLabel(ID_LABEL, { exact: true });
  const token = page.getByLabel(TOKEN_LABEL, { exact: true });
  await id.fill(ID);
  await id.fill(EMPTY_STRING);
  await token.focus();
  await expect(page.getByText(ID_ERROR, { exact: true })).toHaveCount(0);
  await expect(page.getByText(TOKEN_ERROR, { exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: SUBMIT, exact: true }).click();
  await expect(page.getByText(ID_ERROR, { exact: true })).toBeVisible();
  await expect(page.getByText(TOKEN_ERROR, { exact: true })).toBeVisible();
  await expect(id).toBeFocused();

  await id.fill(ID);
  await expect(page.getByText(ID_ERROR, { exact: true })).toHaveCount(0);
  await expect(id).toBeFocused();
  await token.fill(TOKEN);
  await expect(page.getByText(TOKEN_ERROR, { exact: true })).toHaveCount(0);
  await id.fill(EMPTY_STRING);
  await expect(page.getByText(ID_ERROR, { exact: true })).toBeVisible();
  await token.fill(EMPTY_STRING);
  await expect(page.getByText(TOKEN_ERROR, { exact: true })).toBeVisible();
});

for (const populated of ['id', 'token'] as const) {
  test(`Enter focuses the missing field when only ${populated} is filled`, async ({
    page,
  }) => {
    const id = page.getByLabel(ID_LABEL, { exact: true });
    const token = page.getByLabel(TOKEN_LABEL, { exact: true });
    const filled = populated === 'id' ? id : token;
    const empty = populated === 'id' ? token : id;
    const error = populated === 'id' ? TOKEN_ERROR : ID_ERROR;
    const absentError = populated === 'id' ? ID_ERROR : TOKEN_ERROR;
    const value = populated === 'id' ? ID : TOKEN;
    await filled.fill(value);
    await filled.press('Enter');
    await expect(empty).toBeFocused();
    await expect(page.getByText(error, { exact: true })).toBeVisible();
    await expect(page.getByText(absentError, { exact: true })).toHaveCount(0);
    await expect(filled).toHaveValue(value);
    await filled.press('Enter');
    await expect(empty).toBeFocused();
    await expect(page.getByText(error, { exact: true })).toHaveCount(1);
  });
}

test('Enter validates two empty fields and whitespace without normalizing values', async ({
  page,
}) => {
  const id = page.getByLabel(ID_LABEL, { exact: true });
  const token = page.getByLabel(TOKEN_LABEL, { exact: true });
  await id.press('Enter');
  await expect(page.getByText(ID_ERROR, { exact: true })).toBeVisible();
  await expect(page.getByText(TOKEN_ERROR, { exact: true })).toBeVisible();
  await id.fill(WHITESPACE_ONLY);
  await token.fill(WHITESPACE_ONLY);
  await token.press('Enter');
  await expect(id).toBeFocused();
  await expect(page.getByText(ID_ERROR, { exact: true })).toBeVisible();
  await expect(page.getByText(TOKEN_ERROR, { exact: true })).toBeVisible();
  await expect(id).toHaveValue(WHITESPACE_ONLY);
  await expect(token).toHaveValue(WHITESPACE_ONLY);
});

test('preserves complete values and the page on repeated local submission', async ({
  page,
}) => {
  const id = page.getByLabel(ID_LABEL, { exact: true });
  const token = page.getByLabel(TOKEN_LABEL, { exact: true });
  await id.fill(ID);
  await token.fill(TOKEN);
  await token.press('Enter');
  await page.getByRole('button', { name: SUBMIT, exact: true }).click();
  await expect(page).toHaveURL(BASE_URL + HOME);
  await expect(
    page.getByRole('heading', { name: HEADING, exact: true }),
  ).toBeVisible();
  await expect(id).toHaveValue(ID);
  await expect(token).toHaveValue(TOKEN);
  await expect(page.getByText(ID_ERROR, { exact: true })).toHaveCount(0);
  await expect(page.getByText(TOKEN_ERROR, { exact: true })).toHaveCount(0);
  await expect(page.getByText(/успешн|авторизован|загрузка/i)).toHaveCount(0);
  // This step checks presence only; server-side format rules are a separate feature.
  await id.fill('arbitrary-id');
  await token.fill('x');
  await token.press('Enter');
  await expect(id).toHaveAttribute('aria-invalid', 'false');
  await expect(token).toHaveAttribute('aria-invalid', 'false');
});

test('supports keyboard order, visible focus and accessible errors', async ({
  page,
}) => {
  const id = page.getByLabel(ID_LABEL, { exact: true });
  const token = page.getByLabel(TOKEN_LABEL, { exact: true });
  const toggle = page.getByRole('button', { name: SHOW_TOKEN, exact: true });
  const submit = page.getByRole('button', { name: SUBMIT, exact: true });
  const link = page.getByRole('link', { name: CABINET_LABEL, exact: true });

  await expect(id).not.toHaveAttribute('aria-describedby');
  await expect(token).not.toHaveAttribute('aria-describedby');

  await page.keyboard.press('Tab');
  for (const control of [id, token, toggle, submit, link]) {
    await expect(control).toBeFocused();
    expect(
      await control.evaluate((element) => {
        const style = getComputedStyle(element);
        return (
          style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0
        );
      }),
    ).toBe(true);
    if (control !== link) await page.keyboard.press('Tab');
  }
  await page.keyboard.press('Shift+Tab');
  await expect(submit).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(id).toBeFocused();
  for (const [input, message] of [
    [id, ID_ERROR],
    [token, TOKEN_ERROR],
  ] as const) {
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    const error = page.getByText(message, { exact: true });
    const errorId = await error.getAttribute('id');
    expect(errorId).toBeTruthy();
    expect(
      (await input.getAttribute('aria-describedby'))?.split(/\s+/),
    ).toContain(errorId);
    await expect(error).toHaveAttribute('aria-live', ARIA_LIVE_POLITE);
  }
});

test('opens the cabinet in a separate safe tab and preserves input', async ({
  page,
  context,
}) => {
  await page.getByLabel(ID_LABEL, { exact: true }).fill(ID);
  await page.getByLabel(TOKEN_LABEL, { exact: true }).fill(TOKEN);
  const link = page.getByRole('link', { name: CABINET_LABEL, exact: true });
  await expect(page.getByText(HELP_QUESTION, { exact: true })).toBeVisible();
  await expect(page.getByText(NEW_TAB, { exact: true })).toBeVisible();
  await expect(link).toHaveAttribute('href', CABINET_URL);
  await expect(link).toHaveAttribute('target', LINK_TARGET_NEW_TAB);
  expect((await link.getAttribute('rel'))?.split(/\s+/)).toEqual(
    expect.arrayContaining([...LINK_REL_EXTERNAL]),
  );
  await expect(page.getByText(/новой вкладке/)).toBeVisible();
  const requests: string[] = [];
  await context.route(CABINET_URL, async (route) => {
    const request = route.request();
    requests.push(
      JSON.stringify({
        url: request.url(),
        headers: await request.allHeaders(),
        body: request.postData(),
      }),
    );
    await route.fulfill({
      status: HTTP_OK,
      contentType: 'text/html',
      body: '<title>Cabinet test fixture</title>',
    });
  });
  const popupReady = page.waitForEvent('popup');
  await link.click();
  const popup = await popupReady;
  await popup.waitForLoadState();
  await expect(popup).toHaveURL(CABINET_URL);
  expect(requests).toHaveLength(1);
  for (const value of [ID, TOKEN, encodeURIComponent(TOKEN)])
    expect(requests.join(EMPTY_STRING)).not.toContain(value);
  await expect(page.getByLabel(ID_LABEL, { exact: true })).toHaveValue(ID);
  await expect(page.getByLabel(TOKEN_LABEL, { exact: true })).toHaveValue(
    TOKEN,
  );
  await popup.close();
});
