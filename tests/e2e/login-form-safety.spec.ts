import { expect, test, type BrowserContext } from '@playwright/test';
import { EMPTY_STRING } from '@/lib/ui/constants';
import {
  BASE_URL,
  CREDENTIALS,
  HTML_CONTRACT,
  LOGIN_CONTRACT,
  ROUTES,
  VIEWPORTS,
} from './constants';

const { ID, TOKEN } = CREDENTIALS;
const {
  ID_LABEL,
  TOKEN_LABEL,
  SUBMIT,
  SHOW_TOKEN,
  NO_SCRIPT,
  ID_ERROR,
  HEADING,
} = LOGIN_CONTRACT;
const { HOME } = ROUTES;
const { INPUT_PASSWORD } = HTML_CONTRACT;

function observeCredentials(context: BrowserContext) {
  const records: Promise<string>[] = [];
  const logs: string[] = [];
  context.on('request', (request) => {
    records.push(
      request.allHeaders().then((headers) =>
        JSON.stringify({
          url: request.url(),
          headers,
          body: request.postData(),
        }),
      ),
    );
  });
  context.on('console', (message) => logs.push(message.text()));

  return async () => {
    const evidence = [
      ...(await Promise.all(records)),
      ...logs,
      JSON.stringify(await context.cookies()),
    ].join('\n');
    for (const value of [
      ID,
      TOKEN,
      TOKEN.trim(),
      encodeURIComponent(TOKEN),
      encodeURIComponent(TOKEN.trim()),
    ]) {
      expect(evidence).not.toContain(value);
    }
  };
}

test('keeps credentials out of requests, logs and storage and resets on reload', async ({
  page,
  context,
}) => {
  const verifyNoLeaks = observeCredentials(context);
  await page.goto(HOME);
  const id = page.getByLabel(ID_LABEL, { exact: true });
  const token = page.getByLabel(TOKEN_LABEL, { exact: true });
  await expect(id).toBeEnabled();
  await id.fill(ID);
  await token.fill(TOKEN);
  await page.getByRole('button', { name: SUBMIT, exact: true }).click();
  await token.press('Enter');
  await page.getByRole('button', { name: SHOW_TOKEN, exact: true }).click();
  await expect(page).toHaveURL(BASE_URL + HOME);
  const storage = await page.evaluate(async () => ({
    local: Object.entries(localStorage),
    session: Object.entries(sessionStorage),
    databases: await indexedDB.databases(),
  }));
  expect(storage).toEqual({ local: [], session: [], databases: [] });
  expect(await context.cookies()).toEqual([]);
  await page.reload();
  await expect(id).toBeEnabled();
  await expect(id).toHaveValue(EMPTY_STRING);
  await expect(token).toHaveValue(EMPTY_STRING);
  await expect(token).toHaveAttribute('type', INPUT_PASSWORD);
  await expect(page.getByText(ID_ERROR, { exact: true })).toHaveCount(0);
  await verifyNoLeaks();
});

for (const mode of ['disabled', 'blocked'] as const) {
  test(`prevents credential serialization with JavaScript ${mode}`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      baseURL: BASE_URL,
      javaScriptEnabled: mode !== 'disabled',
    });
    const verifyNoLeaks = observeCredentials(context);
    let blockedScripts = 0;
    try {
      if (mode === 'blocked') {
        await context.route('**/*', (route) => {
          if (route.request().resourceType() === 'script') {
            blockedScripts += 1;
            return route.abort();
          }
          return route.continue();
        });
      }
      const page = await context.newPage();
      await page.goto(HOME);
      await expect(
        page.getByRole('heading', { name: HEADING, exact: true }),
      ).toBeVisible();
      const id = page.getByLabel(ID_LABEL, { exact: true });
      const token = page.getByLabel(TOKEN_LABEL, { exact: true });
      await expect(id).toBeDisabled();
      await expect(token).toBeDisabled();
      await expect(
        page.getByRole('button', { name: SHOW_TOKEN, exact: true }),
      ).toBeDisabled();
      await expect(
        page.getByRole('button', { name: SUBMIT, exact: true }),
      ).toBeDisabled();
      await expect(id).not.toHaveAttribute('name');
      await expect(token).not.toHaveAttribute('name');
      if (mode === 'disabled')
        await expect(page.getByText(NO_SCRIPT, { exact: true })).toBeVisible();
      else expect(blockedScripts).toBeGreaterThan(0);

      // Even a forced native submission cannot serialize the credential inputs.
      // evaluate is test instrumentation; the application's scripts stay unavailable.
      await id.evaluate((element, value) => {
        (element as HTMLInputElement).value = value;
      }, ID);
      await token.evaluate((element, value) => {
        (element as HTMLInputElement).value = value;
      }, TOKEN);
      const navigation = page.waitForEvent(
        'framenavigated',
        (frame) => frame === page.mainFrame(),
      );
      await page
        .locator('form')
        .evaluate((element) => (element as HTMLFormElement).requestSubmit());
      await navigation;
      await page.waitForLoadState();
      expect(page.url()).not.toContain(ID);
      expect(page.url()).not.toContain(encodeURIComponent(TOKEN));
      await verifyNoLeaks();
    } finally {
      await context.close();
    }
  });
}

for (const viewport of VIEWPORTS) {
  test(`fits the ${viewport.width}px viewport before and after errors`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto(HOME);
    const id = page.getByLabel(ID_LABEL, { exact: true });
    await expect(id).toBeEnabled();

    for (const state of ['initial', 'errors']) {
      if (state === 'errors')
        await page.getByRole('button', { name: SUBMIT, exact: true }).click();
      await page.evaluate(() => window.scrollTo(0, 0));
      const geometry = await page.evaluate(() => {
        const heading = document.querySelector('h1')!.getBoundingClientRect();
        const controls = [...document.querySelectorAll('input, button, a')].map(
          (element) => {
            const box = element.getBoundingClientRect();
            return {
              left: box.left,
              right: box.right,
              width: box.width,
              height: box.height,
            };
          },
        );
        const main = document.querySelector('main')!.getBoundingClientRect();
        return {
          scrollWidth: document.documentElement.scrollWidth,
          width: innerWidth,
          headingTop: heading.top,
          controls,
          mainLeft: main.left,
          mainRight: main.right,
        };
      });
      expect(geometry.scrollWidth).toBeLessThanOrEqual(viewport.width);
      expect(geometry.headingTop).toBeGreaterThanOrEqual(0);
      expect(
        Math.abs(geometry.mainLeft - (viewport.width - geometry.mainRight)),
      ).toBeLessThanOrEqual(1);
      for (const control of geometry.controls) {
        expect(control.left).toBeGreaterThanOrEqual(0);
        expect(control.right).toBeLessThanOrEqual(viewport.width);
        expect(control.width).toBeGreaterThan(0);
        expect(control.height).toBeGreaterThan(0);
      }
      await page.screenshot({
        path: testInfo.outputPath(`login-${viewport.width}-${state}.png`),
        fullPage: true,
      });
    }
    await id.scrollIntoViewIfNeeded();
    await expect(id).toBeInViewport();
    await page
      .getByRole('button', { name: SUBMIT, exact: true })
      .scrollIntoViewIfNeeded();
    await expect(
      page.getByRole('button', { name: SUBMIT, exact: true }),
    ).toBeInViewport();
  });
}
