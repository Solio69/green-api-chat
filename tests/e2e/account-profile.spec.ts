import type { Page } from '@playwright/test'
import { expect, test } from './owner-fixture'
import { readStyles, textContrast } from './ui-theme.helpers'
import { EMPTY_STRING } from '@/lib/ui/constants'
import {
  ACCOUNT_CONTRACT,
  ACCOUNT_SCENARIOS,
  CONVERSATION_CONTRACT,
  CREDENTIALS,
  GREEN_API_CONTRACT,
  LOGIN_API_CONTRACT,
  LOGIN_CONTRACT,
  MIN_TOUCH_TARGET_SIZE,
  RECIPIENT_CONTRACT,
  ROUTES,
  SESSION_CONTRACT,
  TEST_UI,
  THEME_BROWSER,
  THEME_CONTRACT,
} from '../constants'

const { HOME, LOGIN, LOGIN_API } = ROUTES
const { ID, TOKEN } = CREDENTIALS
const { OK_STATUS } = LOGIN_API_CONTRACT
const { HEADING } = LOGIN_CONTRACT
const {
  LOGOUT,
  SEARCH_HEADING,
  PHONE_LABEL,
  PHONE_MODE,
  SUBMIT: SEARCH_SUBMIT,
} = RECIPIENT_CONTRACT
const { COOKIE_NAME } = SESSION_CONTRACT
const { SIDEBAR_LABEL } = CONVERSATION_CONTRACT
const {
  ROLE_BUTTON,
  ROLE_HEADING,
  ROLE_LINK,
  ROLE_REGION,
  ROLE_COMPLEMENTARY,
  ATTR_SRC,
  ATTR_ALT,
  STYLE_NONE,
  EVENT_REQUEST,
  KEY_TAB,
  KEY_ENTER,
  SVG_SELECTOR,
  INPUT_SELECTOR,
  ATTR_ARIA_INVALID,
  BOOLEAN_TRUE,
} = TEST_UI
const { HOST: PROVIDER_HOST } = GREEN_API_CONTRACT
const {
  REGION,
  DEFAULT_LABEL,
  CONNECTED,
  IMAGE_SELECTOR,
  MOBILE_VIEWPORT,
  DESKTOP_VIEWPORT,
  RETRY_LINK,
  PNG_CONTENT_TYPE,
  PNG_BASE64,
  REFERRER_POLICY_ATTRIBUTE,
  REFERRER_POLICY,
  MISSING_IMAGE_STATUS,
  IMAGE_WIDTH_PROPERTY,
  IMAGE_ENCODING,
  ACCESS_LOST_URL_PATTERN,
} = ACCOUNT_CONTRACT
const { COLOR_SCHEME_LIGHT, COLOR_SCHEME_DARK } = THEME_BROWSER
const { LIGHT, DARK, MIN_TEXT_CONTRAST } = THEME_CONTRACT
const {
  username,
  phone,
  empty,
  avatar,
  brokenAvatar,
  longLabel,
  temporary,
  unauthorized,
  rateLimited,
  themeMobile,
  themeDesktop,
} = ACCOUNT_SCENARIOS

const enterAccount = async ({ page, id }: { page: Page; id: string }) => {
  const response = await page.request.post(LOGIN_API, {
    data: { idInstance: id, apiTokenInstance: TOKEN },
  })
  expect(response.status()).toBe(OK_STATUS)
  await page.goto(HOME)
}

for (const scenario of [
  { id: username.id, label: username.username },
  { id: phone.id, label: phone.phone },
  { id: empty.id, label: DEFAULT_LABEL },
]) {
  test(`account-header: displays own account ${scenario.id} and survives refresh`, async ({
    page,
  }) => {
    const browserRequests: string[] = []
    page.on(EVENT_REQUEST, (request) => browserRequests.push(request.url()))
    await enterAccount({ page, id: scenario.id })
    const region = page.getByRole(ROLE_REGION, { name: REGION })
    const { label } = scenario
    await expect(region.getByText(label, { exact: true })).toBeVisible()
    await expect(region.locator(SVG_SELECTOR).first()).toBeVisible()
    await expect(region.getByText(CONNECTED, { exact: true })).toBeVisible()
    await expect(
      page.getByRole(ROLE_HEADING, { name: SEARCH_HEADING }),
    ).toBeVisible()
    await expect(
      page.getByRole(ROLE_BUTTON, { name: LOGOUT, exact: true }),
    ).toHaveCount(1)
    await page.reload()
    await expect(region.getByText(label, { exact: true })).toBeVisible()
    expect(await region.innerHTML()).not.toContain(TOKEN.trim())
    expect(await region.innerHTML()).not.toContain(scenario.id)
    expect(browserRequests.some((url) => url.startsWith(PROVIDER_HOST))).toBe(
      false,
    )
  })
}

test('account-avatar: loads a direct decorative image without a referrer', async ({
  page,
}) => {
  await page.route(avatar.avatar, (route) =>
    route.fulfill({
      contentType: PNG_CONTENT_TYPE,
      body: Buffer.from(PNG_BASE64, IMAGE_ENCODING),
    }),
  )
  await enterAccount({ page, id: avatar.id })
  const image = page
    .getByRole(ROLE_REGION, { name: REGION })
    .locator(IMAGE_SELECTOR)
  await expect(image).toBeVisible()
  await expect(image).toHaveAttribute(ATTR_SRC, avatar.avatar)
  await expect(image).toHaveAttribute(ATTR_ALT, EMPTY_STRING)
  await expect(image).toHaveAttribute(
    REFERRER_POLICY_ATTRIBUTE,
    REFERRER_POLICY,
  )
  await expect(image).toHaveJSProperty(IMAGE_WIDTH_PROPERTY, 1)
})

test('account-avatar: failure shows an icon and a new URL can load', async ({
  page,
}) => {
  await page.route(brokenAvatar.avatar, (route) =>
    route.fulfill({ status: MISSING_IMAGE_STATUS }),
  )
  await page.route(brokenAvatar.replacementAvatar, (route) =>
    route.fulfill({
      contentType: PNG_CONTENT_TYPE,
      body: Buffer.from(PNG_BASE64, IMAGE_ENCODING),
    }),
  )
  await enterAccount({ page, id: brokenAvatar.id })
  const region = page.getByRole(ROLE_REGION, { name: REGION })
  await expect(region.locator(IMAGE_SELECTOR)).toHaveCount(0)
  await expect(region.locator(SVG_SELECTOR).first()).toBeVisible()
  await page.reload()
  await expect(region.locator(IMAGE_SELECTOR)).toHaveAttribute(
    ATTR_SRC,
    brokenAvatar.replacementAvatar,
  )
  await expect(region.locator(IMAGE_SELECTOR)).toHaveJSProperty(
    IMAGE_WIDTH_PROPERTY,
    1,
  )
})

test('account-header: long full label fits mobile and desktop, logout works by keyboard', async ({
  page,
}, testInfo) => {
  await enterAccount({ page, id: longLabel.id })
  const region = page.getByRole(ROLE_REGION, { name: REGION })
  const label = region.getByText(longLabel.username, { exact: true })
  const logout = region.getByRole(ROLE_BUTTON, { name: LOGOUT, exact: true })
  for (const viewport of [MOBILE_VIEWPORT, DESKTOP_VIEWPORT]) {
    await page.setViewportSize(viewport)
    await expect(label).toBeVisible()
    const bounds = await label.boundingBox()
    const buttonBounds = await logout.boundingBox()
    expect(
      bounds && buttonBounds && bounds.x + bounds.width <= buttonBounds.x,
    ).toBe(true)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
    await page.screenshot({
      path: testInfo.outputPath(`account-header-${viewport.width}.png`),
    })
  }
  expect(
    await label.evaluate((element) => getComputedStyle(element).color),
  ).toBe(LIGHT.TEXT)
  expect(
    await logout.evaluate((element) => getComputedStyle(element).color),
  ).toBe(LIGHT.MUTED)
  await page.mouse.click(0, 0)
  await page.keyboard.press(KEY_TAB)
  await expect(logout).toBeFocused()
  expect(
    await logout.evaluate((element) => getComputedStyle(element).outlineStyle),
  ).not.toBe(STYLE_NONE)
  expect(
    await logout.evaluate((element) => getComputedStyle(element).outlineColor),
  ).toBe(LIGHT.ACTION)
  await page.keyboard.press(KEY_ENTER)
  await expect(page).toHaveURL(LOGIN)
  await expect(page.getByRole(ROLE_HEADING, { name: HEADING })).toBeVisible()
  expect(
    (await page.context().cookies()).some(
      (cookie) => cookie.name === COOKIE_NAME,
    ),
  ).toBe(false)
  await page.goto(HOME)
  await expect(page).toHaveURL(LOGIN)
})

test('account-header: temporary failure keeps session and manual retry restores profile', async ({
  page,
}) => {
  await enterAccount({ page, id: temporary.id })
  await expect(page.getByRole(ROLE_REGION, { name: REGION })).toHaveCount(0)
  await expect(
    page.getByRole(ROLE_HEADING, { name: SEARCH_HEADING }),
  ).toHaveCount(0)
  await expect(
    page.getByRole(ROLE_BUTTON, { name: LOGOUT, exact: true }),
  ).toHaveCount(1)
  expect(
    (await page.context().cookies()).some(
      (cookie) => cookie.name === COOKIE_NAME,
    ),
  ).toBe(true)
  await page.getByRole(ROLE_LINK, { name: RETRY_LINK }).click()
  await expect(
    page
      .getByRole(ROLE_REGION, { name: REGION })
      .getByText(temporary.username, { exact: true }),
  ).toBeVisible()
})

test('account-header: confirmed invalid access clears session', async ({
  page,
}) => {
  await enterAccount({ page, id: unauthorized.id })
  await expect(page).toHaveURL(ACCESS_LOST_URL_PATTERN)
  await expect(page.getByRole(ROLE_REGION, { name: REGION })).toHaveCount(0)
  expect(
    (await page.context().cookies()).some(
      (cookie) => cookie.name === COOKIE_NAME,
    ),
  ).toBe(false)
})

test('account-header: one automatic retry after 429 shows profile immediately', async ({
  page,
}) => {
  await enterAccount({ page, id: rateLimited.id })
  await expect(
    page
      .getByRole(ROLE_REGION, { name: REGION })
      .getByText(rateLimited.username, { exact: true }),
  ).toBeVisible()
  await expect(page.getByRole(ROLE_LINK, { name: RETRY_LINK })).toHaveCount(0)
})

for (const { viewport, scenario } of [
  { viewport: MOBILE_VIEWPORT, scenario: themeMobile },
  { viewport: DESKTOP_VIEWPORT, scenario: themeDesktop },
]) {
  test(`account-header: system theme reaches header, avatar and search at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport)
    await enterAccount({ page, id: scenario.id })
    const region = page.getByRole(ROLE_REGION, { name: REGION })
    const label = region.getByText(scenario.phone, { exact: true })
    const connection = region.getByText(CONNECTED, { exact: true })
    const logout = region.getByRole(ROLE_BUTTON, { name: LOGOUT, exact: true })
    const placeholder = region.locator(SVG_SELECTOR).first()
    const field = page.getByLabel(PHONE_LABEL, { exact: true })
    const search = page.getByRole(ROLE_BUTTON, {
      name: SEARCH_SUBMIT,
      exact: true,
    })
    const mode = page.getByRole(ROLE_BUTTON, { name: PHONE_MODE, exact: true })
    await field.fill(ID)
    await expect(logout.locator(SVG_SELECTOR)).toBeVisible()
    await expect(region.locator(IMAGE_SELECTOR)).toHaveCount(0)

    for (const theme of [
      { colorScheme: COLOR_SCHEME_DARK, expected: DARK },
      { colorScheme: COLOR_SCHEME_LIGHT, expected: LIGHT },
    ]) {
      await page.emulateMedia({ colorScheme: theme.colorScheme })
      const { expected } = theme
      expect(
        await page.evaluate(
          () => getComputedStyle(document.body).backgroundColor,
        ),
      ).toBe(expected.CANVAS)
      expect(
        (
          await readStyles(
            page.getByRole(ROLE_COMPLEMENTARY, { name: SIDEBAR_LABEL }),
          )
        ).background,
      ).toBe(expected.SURFACE)
      expect((await readStyles(label)).color).toBe(expected.TEXT)
      expect((await readStyles(connection)).color).toBe(expected.MUTED)
      expect((await readStyles(logout)).color).toBe(expected.MUTED)
      expect((await readStyles(placeholder)).color).toBe(expected.ACTION)
      expect((await readStyles(field)).background).toBe(expected.INPUT)
      expect((await readStyles(field)).color).toBe(expected.TEXT)
      expect((await readStyles(search)).background).toBe(expected.ACTION)
      await field.focus()
      expect((await readStyles(field)).border).toBe(expected.ACTION)
      expect((await readStyles(field)).shadow).not.toBe(STYLE_NONE)
      expect((await readStyles(field)).outlineWidth).toBe(0)
      for (const control of [label, connection, logout, mode]) {
        expect(
          textContrast({
            color: (await readStyles(control)).color,
            background: expected.SURFACE,
          }),
        ).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST)
      }
      expect(textContrast(await readStyles(search))).toBeGreaterThanOrEqual(
        MIN_TEXT_CONTRAST,
      )
      await expect(field).toHaveValue(ID)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true)
      const logoutBox = (await logout.boundingBox())!
      expect(logoutBox.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
      expect(logoutBox.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
      await page.screenshot({
        path: testInfo.outputPath(
          `home-${theme.colorScheme}-${viewport.width}.png`,
        ),
        fullPage: true,
      })
    }

    await page.emulateMedia({ colorScheme: COLOR_SCHEME_DARK })
    await field.fill(EMPTY_STRING)
    await search.click()
    await expect(field).toHaveAttribute(ATTR_ARIA_INVALID, BOOLEAN_TRUE)
    await field.focus()
    expect((await readStyles(field)).border).toBe(DARK.ERROR)
    expect((await readStyles(field)).shadow).not.toBe(STYLE_NONE)
    expect((await readStyles(field)).outlineWidth).toBe(0)
    expect(await page.locator(INPUT_SELECTOR).count()).toBe(1)
  })
}
