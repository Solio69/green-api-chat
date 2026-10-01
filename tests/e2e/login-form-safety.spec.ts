import { expect, test, type BrowserContext } from '@playwright/test'
import { EMPTY_STRING } from '@/lib/ui/constants'
import {
  BASE_URL,
  CREDENTIALS,
  HTML_CONTRACT,
  LOGIN_API_CONTRACT,
  TEST_BROWSER_FIXTURES,
  TEST_FETCH_CONTRACT,
  TEST_UI,
  LOGIN_CONTRACT,
  ROUTE_PATTERNS,
  ROUTES,
  VIEWPORTS,
} from '../constants'

const { ID, TOKEN } = CREDENTIALS
const {
  ID_LABEL,
  TOKEN_LABEL,
  SUBMIT,
  SHOW_TOKEN,
  NO_SCRIPT,
  ID_ERROR,
  HEADING,
} = LOGIN_CONTRACT
const { LOGIN } = ROUTES
const { INPUT_PASSWORD } = HTML_CONTRACT
const {
  UNAUTHORIZED_STATUS,
  RESPONSE_ERROR,
  INVALID_TOKEN,
  JSON_CONTENT_TYPE,
} = LOGIN_API_CONTRACT
const { METHOD_POST } = TEST_FETCH_CONTRACT
const {
  BLOCKED_SCRIPT_ROUTE,
  DISABLED,
  BLOCKED,
  INITIAL,
  ERRORS,
  LOG_SEPARATOR,
} = TEST_BROWSER_FIXTURES
const {
  ROLE_BUTTON,
  ROLE_HEADING,
  ATTR_TYPE,
  ATTR_NAME,
  EVENT_FRAME_NAVIGATED,
  EVENT_REQUEST,
  EVENT_CONSOLE,
  RESOURCE_SCRIPT,
  FORM_SELECTOR,
  H1_SELECTOR,
  CONTROL_SELECTOR,
  MAIN_SELECTOR,
  KEY_ENTER,
} = TEST_UI

const observeCredentials = (context: BrowserContext) => {
  const records: Promise<{
    url: string
    method: string
    headers: Record<string, string>
    body: string | null
  }>[] = []
  const logs: string[] = []
  context.on(
    EVENT_REQUEST,
    (request) =>
      void records.push(
        request.allHeaders().then((headers) => ({
          url: request.url(),
          method: request.method(),
          headers,
          body: request.postData(),
        })),
      ),
  )
  context.on(EVENT_CONSOLE, (message) => logs.push(message.text()))

  return async () => {
    const values = [
      ID,
      TOKEN,
      TOKEN.trim(),
      encodeURIComponent(TOKEN),
      encodeURIComponent(TOKEN.trim()),
    ]
    for (const request of await Promise.all(records)) {
      const metadata = JSON.stringify({
        url: request.url,
        method: request.method,
        headers: request.headers,
      })
      for (const value of values) expect(metadata).not.toContain(value)
      if (
        request.url === `${BASE_URL}${ROUTES.LOGIN_API}` &&
        request.method === METHOD_POST
      ) {
        expect(JSON.parse(request.body ?? EMPTY_STRING)).toEqual({
          idInstance: ID,
          apiTokenInstance: TOKEN,
        })
      } else {
        for (const value of values)
          expect(request.body ?? EMPTY_STRING).not.toContain(value)
      }
    }
    const otherEvidence = [
      ...logs,
      JSON.stringify(await context.cookies()),
    ].join(LOG_SEPARATOR)
    for (const value of values) expect(otherEvidence).not.toContain(value)
  }
}
test('keeps credentials out of requests, logs and storage and resets on reload', async ({
  page,
  context,
}) => {
  const verifyNoLeaks = observeCredentials(context)
  await page.route(ROUTE_PATTERNS.LOGIN_API, async (route) =>
    route.fulfill({
      status: UNAUTHORIZED_STATUS,
      contentType: JSON_CONTENT_TYPE,
      body: JSON.stringify({ status: RESPONSE_ERROR, code: INVALID_TOKEN }),
    }),
  )
  await page.goto(LOGIN)
  const id = page.getByLabel(ID_LABEL, { exact: true })
  const token = page.getByLabel(TOKEN_LABEL, { exact: true })
  await expect(id).toBeEnabled()
  await id.fill(ID)
  await token.fill(TOKEN)
  await page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }).click()
  await token.press(KEY_ENTER)
  await page.getByRole(ROLE_BUTTON, { name: SHOW_TOKEN, exact: true }).click()
  await expect(page).toHaveURL(`${BASE_URL}${LOGIN}`)
  const storage = await page.evaluate(async () => ({
    local: Object.entries(localStorage),
    session: Object.entries(sessionStorage),
    databases: await indexedDB.databases(),
  }))
  expect(storage).toEqual({ local: [], session: [], databases: [] })
  expect(await context.cookies()).toEqual([])
  await page.reload()
  await expect(id).toBeEnabled()
  await expect(id).toHaveValue(EMPTY_STRING)
  await expect(token).toHaveValue(EMPTY_STRING)
  await expect(token).toHaveAttribute(ATTR_TYPE, INPUT_PASSWORD)
  await expect(page.getByText(ID_ERROR, { exact: true })).toHaveCount(0)
  await verifyNoLeaks()
})

for (const mode of [DISABLED, BLOCKED] as const) {
  test(`prevents credential serialization with JavaScript ${mode}`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      baseURL: BASE_URL,
      javaScriptEnabled: mode !== DISABLED,
    })
    const verifyNoLeaks = observeCredentials(context)
    let blockedScripts = 0
    try {
      if (mode === BLOCKED) {
        await context.route(BLOCKED_SCRIPT_ROUTE, (route) => {
          if (route.request().resourceType() === RESOURCE_SCRIPT) {
            blockedScripts += 1
            return route.abort()
          }
          return route.continue()
        })
      }
      const page = await context.newPage()
      await page.goto(LOGIN)
      await expect(
        page.getByRole(ROLE_HEADING, { name: HEADING, exact: true }),
      ).toBeVisible()
      const id = page.getByLabel(ID_LABEL, { exact: true })
      const token = page.getByLabel(TOKEN_LABEL, { exact: true })
      await expect(id).toBeDisabled()
      await expect(token).toBeDisabled()
      await expect(
        page.getByRole(ROLE_BUTTON, { name: SHOW_TOKEN, exact: true }),
      ).toBeDisabled()
      await expect(
        page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }),
      ).toBeDisabled()
      await expect(id).not.toHaveAttribute(ATTR_NAME)
      await expect(token).not.toHaveAttribute(ATTR_NAME)
      if (mode === DISABLED)
        await expect(page.getByText(NO_SCRIPT, { exact: true })).toBeVisible()
      else expect(blockedScripts).toBeGreaterThan(0)

      // Even a forced native submission cannot serialize the credential inputs.
      // evaluate is test instrumentation; the application's scripts stay unavailable.
      await id.evaluate(
        (element, value) => void ((element as HTMLInputElement).value = value),
        ID,
      )
      await token.evaluate(
        (element, value) => void ((element as HTMLInputElement).value = value),
        TOKEN,
      )
      const navigation = page.waitForEvent(
        EVENT_FRAME_NAVIGATED,
        (frame) => frame === page.mainFrame(),
      )
      await page
        .locator(FORM_SELECTOR)
        .evaluate((element) => (element as HTMLFormElement).requestSubmit())
      await navigation
      await page.waitForLoadState()
      expect(page.url()).not.toContain(ID)
      expect(page.url()).not.toContain(encodeURIComponent(TOKEN))
      await verifyNoLeaks()
    } finally {
      await context.close()
    }
  })
}

for (const viewport of VIEWPORTS) {
  test(`fits the ${viewport.width}px viewport before and after errors`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport)
    await page.goto(LOGIN)
    const id = page.getByLabel(ID_LABEL, { exact: true })
    await expect(id).toBeEnabled()

    for (const state of [INITIAL, ERRORS]) {
      if (state === ERRORS)
        await page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }).click()
      await page.evaluate(() => window.scrollTo(0, 0))
      const geometry = await page.evaluate(
        ({ h1Selector, controlSelector, mainSelector }) => {
          const heading = document
            .querySelector(h1Selector)!
            .getBoundingClientRect()
          const controls = [...document.querySelectorAll(controlSelector)].map(
            (element) => {
              const box = element.getBoundingClientRect()
              return {
                left: box.left,
                right: box.right,
                width: box.width,
                height: box.height,
              }
            },
          )
          const main = document
            .querySelector(mainSelector)!
            .getBoundingClientRect()
          return {
            scrollWidth: document.documentElement.scrollWidth,
            width: innerWidth,
            headingTop: heading.top,
            controls,
            mainLeft: main.left,
            mainRight: main.right,
          }
        },
        {
          h1Selector: H1_SELECTOR,
          controlSelector: CONTROL_SELECTOR,
          mainSelector: MAIN_SELECTOR,
        },
      )
      expect(geometry.scrollWidth).toBeLessThanOrEqual(viewport.width)
      expect(geometry.headingTop).toBeGreaterThanOrEqual(0)
      expect(
        Math.abs(geometry.mainLeft - (viewport.width - geometry.mainRight)),
      ).toBeLessThanOrEqual(1)
      for (const control of geometry.controls) {
        expect(control.left).toBeGreaterThanOrEqual(0)
        expect(control.right).toBeLessThanOrEqual(viewport.width)
        expect(control.width).toBeGreaterThan(0)
        expect(control.height).toBeGreaterThan(0)
      }
      await page.screenshot({
        path: testInfo.outputPath(`login-${viewport.width}-${state}.png`),
        fullPage: true,
      })
    }
    await id.scrollIntoViewIfNeeded()
    await expect(id).toBeInViewport()
    await page
      .getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true })
      .scrollIntoViewIfNeeded()
    await expect(
      page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }),
    ).toBeInViewport()
  })
}
