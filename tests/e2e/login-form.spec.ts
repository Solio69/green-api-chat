import { expect, test } from '@playwright/test'
import { HTTP_STATUS } from '@/lib/http/constants'
import { EMPTY_STRING } from '@/lib/ui/constants'
import {
  BASE_URL,
  LOGIN_API_CONTRACT,
  TEST_BROWSER_FIXTURES,
  TEST_UI,
  CREDENTIALS,
  HTML_CONTRACT,
  LOGIN_CONTRACT,
  MIN_TOUCH_TARGET_SIZE,
  ROUTE_PATTERNS,
  ROUTES,
  VIEWPORTS,
  WHITESPACE_ONLY,
} from '../constants'

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
} = LOGIN_CONTRACT
const { ID, TOKEN } = CREDENTIALS
const { LOGIN } = ROUTES
const {
  INPUT_TEXT,
  INPUT_PASSWORD,
  ARIA_LIVE_POLITE,
  LINK_TARGET_NEW_TAB,
  LINK_REL_EXTERNAL,
} = HTML_CONTRACT
const { OK: HTTP_OK } = HTTP_STATUS
const { UNAVAILABLE_STATUS, RESPONSE_ERROR, RETRY_LATER } = LOGIN_API_CONTRACT
const {
  HTML_CONTENT_TYPE,
  CABINET_HTML,
  ID_WITHOUT_FORMAT,
  TOKEN_WITHOUT_FORMAT,
  ID_FIELD,
  TOKEN_FIELD,
} = TEST_BROWSER_FIXTURES
const {
  ROLE_BUTTON,
  ROLE_HEADING,
  ROLE_LINK,
  SVG_SELECTOR,
  ATTR_TYPE,
  ATTR_TITLE,
  ATTR_ARIA_HIDDEN,
  ATTR_ARIA_INVALID,
  ATTR_ARIA_DESCRIBEDBY,
  ATTR_ARIA_LIVE,
  ATTR_ID,
  ATTR_HREF,
  ATTR_TARGET,
  ATTR_REL,
  BOOLEAN_TRUE,
  BOOLEAN_FALSE,
  KEY_ENTER,
  KEY_SPACE,
  KEY_TAB,
  KEY_SHIFT_TAB,
  EVENT_POPUP,
  STYLE_NONE,
} = TEST_UI
const TEST_ERROR_MESSAGE = {
  MISSING_TOKEN_CONTROL_GEOMETRY: 'Missing token control geometry',
} as const
const { MISSING_TOKEN_CONTROL_GEOMETRY } = TEST_ERROR_MESSAGE

test.beforeEach(async ({ page }) => {
  await page.goto(LOGIN)
  await expect(page.getByLabel(ID_LABEL, { exact: true })).toBeEnabled()
})

test('hides and reveals the exact token without submitting', async ({
  page,
}) => {
  const token = page.getByLabel(TOKEN_LABEL, { exact: true })
  await token.fill(TOKEN)
  await expect(token).toHaveAttribute(ATTR_TYPE, INPUT_PASSWORD)
  await page
    .getByRole(ROLE_BUTTON, { name: SHOW_TOKEN, exact: true })
    .press(KEY_ENTER)
  await expect(token).toHaveAttribute(ATTR_TYPE, INPUT_TEXT)
  await expect(token).toHaveValue(TOKEN)
  await page
    .getByRole(ROLE_BUTTON, { name: HIDE_TOKEN, exact: true })
    .press(KEY_SPACE)
  await expect(token).toHaveAttribute(ATTR_TYPE, INPUT_PASSWORD)
  await expect(token).toHaveValue(TOKEN)
  await expect(page.getByText(ID_ERROR, { exact: true })).toHaveCount(0)
  await expect(page.getByText(TOKEN_ERROR, { exact: true })).toHaveCount(0)
})

test('places an accessible eye inside the token field without overlapping text', async ({
  page,
}) => {
  const token = page.getByLabel(TOKEN_LABEL, { exact: true })
  const toggle = page.getByRole(ROLE_BUTTON, { name: SHOW_TOKEN, exact: true })
  await token.fill(TOKEN)
  await expect(toggle).toHaveText(EMPTY_STRING)
  await expect(toggle).toHaveAttribute(ATTR_TITLE, SHOW_TOKEN)
  await expect(toggle.locator(SVG_SELECTOR)).toBeVisible()
  await expect(toggle.locator(SVG_SELECTOR)).toHaveAttribute(
    ATTR_ARIA_HIDDEN,
    BOOLEAN_TRUE,
  )

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport)
    const inputBox = await token.boundingBox()
    const buttonBox = await toggle.boundingBox()
    const hasControlGeometry = inputBox !== null && buttonBox !== null
    if (!hasControlGeometry) throw new Error(MISSING_TOKEN_CONTROL_GEOMETRY)
    expect(buttonBox.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
    expect(buttonBox.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
    expect(buttonBox.x).toBeGreaterThan(inputBox.x + inputBox.width / 2)
    expect(buttonBox.y).toBeGreaterThanOrEqual(inputBox.y)
    expect(buttonBox.x + buttonBox.width).toBeLessThanOrEqual(
      inputBox.x + inputBox.width,
    )
    expect(buttonBox.y + buttonBox.height).toBeLessThanOrEqual(
      inputBox.y + inputBox.height,
    )
    const padding = await token.evaluate((element) =>
      parseFloat(getComputedStyle(element).paddingInlineEnd),
    )
    expect(inputBox.x + inputBox.width - padding).toBeLessThanOrEqual(
      buttonBox.x,
    )
  }

  const hiddenIcon = await toggle.locator(SVG_SELECTOR).innerHTML()
  await toggle.click()
  const hide = page.getByRole(ROLE_BUTTON, { name: HIDE_TOKEN, exact: true })
  await expect(hide).toHaveText(EMPTY_STRING)
  await expect(hide).toHaveAttribute(ATTR_TITLE, HIDE_TOKEN)
  expect(await hide.locator(SVG_SELECTOR).innerHTML()).not.toBe(hiddenIcon)
  await expect(token).toHaveAttribute(ATTR_TYPE, INPUT_TEXT)
  await expect(token).toHaveValue(TOKEN)
  await hide.click()
  expect(await toggle.locator(SVG_SELECTOR).innerHTML()).toBe(hiddenIcon)
  await expect(token).toHaveAttribute(ATTR_TYPE, INPUT_PASSWORD)
  await expect(token).toHaveValue(TOKEN)
  await expect(page.getByText(ID_ERROR, { exact: true })).toHaveCount(0)
})

test('shows errors after submit and updates them while editing', async ({
  page,
}) => {
  const id = page.getByLabel(ID_LABEL, { exact: true })
  const token = page.getByLabel(TOKEN_LABEL, { exact: true })
  await id.fill(ID)
  await id.fill(EMPTY_STRING)
  await token.focus()
  await expect(page.getByText(ID_ERROR, { exact: true })).toHaveCount(0)
  await expect(page.getByText(TOKEN_ERROR, { exact: true })).toHaveCount(0)

  await page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }).click()
  await expect(page.getByText(ID_ERROR, { exact: true })).toBeVisible()
  await expect(page.getByText(TOKEN_ERROR, { exact: true })).toBeVisible()
  await expect(id).toBeFocused()

  await id.fill(ID)
  await expect(page.getByText(ID_ERROR, { exact: true })).toHaveCount(0)
  await expect(id).toBeFocused()
  await token.fill(TOKEN)
  await expect(page.getByText(TOKEN_ERROR, { exact: true })).toHaveCount(0)
  await id.fill(EMPTY_STRING)
  await expect(page.getByText(ID_ERROR, { exact: true })).toBeVisible()
  await token.fill(EMPTY_STRING)
  await expect(page.getByText(TOKEN_ERROR, { exact: true })).toBeVisible()
})

for (const populated of [ID_FIELD, TOKEN_FIELD] as const) {
  test(`Enter focuses the missing field when only ${populated} is filled`, async ({
    page,
  }) => {
    const id = page.getByLabel(ID_LABEL, { exact: true })
    const token = page.getByLabel(TOKEN_LABEL, { exact: true })
    const filled = populated === ID_FIELD ? id : token
    const empty = populated === ID_FIELD ? token : id
    const error = populated === ID_FIELD ? TOKEN_ERROR : ID_ERROR
    const absentError = populated === ID_FIELD ? ID_ERROR : TOKEN_ERROR
    const value = populated === ID_FIELD ? ID : TOKEN
    await filled.fill(value)
    await filled.press(KEY_ENTER)
    await expect(empty).toBeFocused()
    await expect(page.getByText(error, { exact: true })).toBeVisible()
    await expect(page.getByText(absentError, { exact: true })).toHaveCount(0)
    await expect(filled).toHaveValue(value)
    await filled.press(KEY_ENTER)
    await expect(empty).toBeFocused()
    await expect(page.getByText(error, { exact: true })).toHaveCount(1)
  })
}

test('Enter validates two empty fields and whitespace without normalizing values', async ({
  page,
}) => {
  const id = page.getByLabel(ID_LABEL, { exact: true })
  const token = page.getByLabel(TOKEN_LABEL, { exact: true })
  await id.press(KEY_ENTER)
  await expect(page.getByText(ID_ERROR, { exact: true })).toBeVisible()
  await expect(page.getByText(TOKEN_ERROR, { exact: true })).toBeVisible()
  await id.fill(WHITESPACE_ONLY)
  await token.fill(WHITESPACE_ONLY)
  await token.press(KEY_ENTER)
  await expect(id).toBeFocused()
  await expect(page.getByText(ID_ERROR, { exact: true })).toBeVisible()
  await expect(page.getByText(TOKEN_ERROR, { exact: true })).toBeVisible()
  await expect(id).toHaveValue(WHITESPACE_ONLY)
  await expect(token).toHaveValue(WHITESPACE_ONLY)
})

test('preserves complete values and the page on rejected server submissions', async ({
  page,
}) => {
  await page.route(ROUTE_PATTERNS.LOGIN_API, async (route) =>
    route.fulfill({
      status: UNAVAILABLE_STATUS,
      contentType: LOGIN_API_CONTRACT.JSON_CONTENT_TYPE,
      body: JSON.stringify({ status: RESPONSE_ERROR, code: RETRY_LATER }),
    }),
  )
  const id = page.getByLabel(ID_LABEL, { exact: true })
  const token = page.getByLabel(TOKEN_LABEL, { exact: true })
  await id.fill(ID)
  await token.fill(TOKEN)
  await token.press(KEY_ENTER)
  await page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }).click()
  await expect(page).toHaveURL(`${BASE_URL}${LOGIN}`)
  await expect(
    page.getByRole(ROLE_HEADING, { name: HEADING, exact: true }),
  ).toBeVisible()
  await expect(id).toHaveValue(ID)
  await expect(token).toHaveValue(TOKEN)
  await expect(page.getByText(ID_ERROR, { exact: true })).toHaveCount(0)
  await expect(page.getByText(TOKEN_ERROR, { exact: true })).toHaveCount(0)
  await expect(page.getByText(LOGIN_CONTRACT.TRANSIENT_TEXT)).toHaveCount(0)
  // This step checks presence only; server-side format rules are a separate feature.
  await id.fill(ID_WITHOUT_FORMAT)
  await token.fill(TOKEN_WITHOUT_FORMAT)
  await token.press(KEY_ENTER)
  await expect(id).toHaveAttribute(ATTR_ARIA_INVALID, BOOLEAN_FALSE)
  await expect(token).toHaveAttribute(ATTR_ARIA_INVALID, BOOLEAN_FALSE)
})

test('supports keyboard order, visible focus and accessible errors', async ({
  page,
}) => {
  const id = page.getByLabel(ID_LABEL, { exact: true })
  const token = page.getByLabel(TOKEN_LABEL, { exact: true })
  const toggle = page.getByRole(ROLE_BUTTON, { name: SHOW_TOKEN, exact: true })
  const submit = page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true })
  const link = page.getByRole(ROLE_LINK, { name: CABINET_LABEL, exact: true })

  await expect(id).not.toHaveAttribute(ATTR_ARIA_DESCRIBEDBY)
  await expect(token).not.toHaveAttribute(ATTR_ARIA_DESCRIBEDBY)

  await page.keyboard.press(KEY_TAB)
  for (const control of [id, token, toggle, submit, link]) {
    await expect(control).toBeFocused()
    expect(
      await control.evaluate((element, noneStyle) => {
        const style = getComputedStyle(element)
        return (
          style.outlineStyle !== noneStyle && parseFloat(style.outlineWidth) > 0
        )
      }, STYLE_NONE),
    ).toBe(true)
    if (control !== link) await page.keyboard.press(KEY_TAB)
  }
  await page.keyboard.press(KEY_SHIFT_TAB)
  await expect(submit).toBeFocused()
  await page.keyboard.press(KEY_ENTER)
  await expect(id).toBeFocused()
  for (const [input, message] of [
    [id, ID_ERROR],
    [token, TOKEN_ERROR],
  ] as const) {
    await expect(input).toHaveAttribute(ATTR_ARIA_INVALID, BOOLEAN_TRUE)
    const error = page.getByText(message, { exact: true })
    const errorId = await error.getAttribute(ATTR_ID)
    expect(errorId).toBeTruthy()
    expect(
      (await input.getAttribute(ATTR_ARIA_DESCRIBEDBY))?.split(/\s+/),
    ).toContain(errorId)
    await expect(error).toHaveAttribute(ATTR_ARIA_LIVE, ARIA_LIVE_POLITE)
  }
})

test('opens the cabinet in a separate safe tab and preserves input', async ({
  page,
  context,
}) => {
  await page.getByLabel(ID_LABEL, { exact: true }).fill(ID)
  await page.getByLabel(TOKEN_LABEL, { exact: true }).fill(TOKEN)
  const link = page.getByRole(ROLE_LINK, { name: CABINET_LABEL, exact: true })
  await expect(page.getByText(HELP_QUESTION, { exact: true })).toHaveCount(0)
  await expect(page.getByText(NEW_TAB, { exact: true })).toHaveCount(0)
  await expect(link).toHaveAttribute(ATTR_HREF, CABINET_URL)
  await expect(link).toHaveAttribute(ATTR_TARGET, LINK_TARGET_NEW_TAB)
  expect((await link.getAttribute(ATTR_REL))?.split(/\s+/)).toEqual(
    expect.arrayContaining([...LINK_REL_EXTERNAL]),
  )
  const requests: string[] = []
  await context.route(CABINET_URL, async (route) => {
    const request = route.request()
    requests.push(
      JSON.stringify({
        url: request.url(),
        headers: await request.allHeaders(),
        body: request.postData(),
      }),
    )
    await route.fulfill({
      status: HTTP_OK,
      contentType: HTML_CONTENT_TYPE,
      body: CABINET_HTML,
    })
  })
  const popupReady = page.waitForEvent(EVENT_POPUP)
  await link.click()
  const popup = await popupReady
  await popup.waitForLoadState()
  await expect(popup).toHaveURL(CABINET_URL)
  expect(requests).toHaveLength(1)
  for (const value of [ID, TOKEN, encodeURIComponent(TOKEN)])
    expect(requests.join(EMPTY_STRING)).not.toContain(value)
  await expect(page.getByLabel(ID_LABEL, { exact: true })).toHaveValue(ID)
  await expect(page.getByLabel(TOKEN_LABEL, { exact: true })).toHaveValue(TOKEN)
  await popup.close()
})
