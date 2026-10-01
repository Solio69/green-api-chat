import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { readStyles, textContrast } from './ui-theme.helpers'
import { EMPTY_STRING } from '@/lib/ui/constants'
import {
  CREDENTIALS,
  LOGIN_API_CONTRACT,
  LOGIN_CONTRACT,
  MIN_TOUCH_TARGET_SIZE,
  RECIPIENT_CONTRACT,
  ROUTE_PATTERNS,
  ROUTES,
  TEST_UI,
  VIEWPORTS,
  THEME_BROWSER,
  THEME_CONTRACT,
} from '../constants'
import {
  LOGIN_UI_BROWSER,
  LOGIN_UI_EXPECTATIONS,
  LOGIN_UI_VIEWPORTS,
} from './login-ui.constants'

const { LOGIN, HOME } = ROUTES
const { LOGIN_API } = ROUTE_PATTERNS
const { ID, TOKEN } = CREDENTIALS
const {
  ID_LABEL,
  TOKEN_LABEL,
  SUBMIT,
  SHOW_TOKEN,
  PENDING,
  RATE_LIMITED,
  ID_ERROR,
  CABINET_LABEL,
} = LOGIN_CONTRACT
const { SUBMIT: SEARCH_SUBMIT, PHONE_LABEL, LOGOUT } = RECIPIENT_CONTRACT
const {
  RATE_LIMIT_STATUS,
  RESPONSE_ERROR,
  RATE_LIMITED: RATE_LIMIT_CODE,
  JSON_CONTENT_TYPE,
} = LOGIN_API_CONTRACT
const {
  ROLE_BUTTON,
  ROLE_STATUS,
  ROLE_LINK,
  MAIN_SELECTOR,
  CONTROL_SELECTOR,
  KEY_ENTER,
  KEY_TAB,
  BOOLEAN_TRUE,
  STYLE_NONE,
} = TEST_UI
const {
  CANVAS,
  SURFACE,
  ACTION,
  ERROR,
  CARD_MAX_WIDTH,
  FIELD_MIN_FONT_SIZE,
  FIELD_ERROR_FONT_SIZE,
  GEOMETRY_TOLERANCE,
} = LOGIN_UI_EXPECTATIONS
const {
  TEXT_SELECTOR,
  ENLARGED_TEXT_STYLE,
  LOADER_SELECTOR,
  ATTR_ARIA_BUSY,
  MEDIA_REDUCE,
  MEDIA_NORMAL,
  FORCED_COLORS_ACTIVE,
  FORCED_COLORS_NONE,
  OUTLINE_SOLID,
} = LOGIN_UI_BROWSER
const {
  CANVAS: DARK_CANVAS,
  SURFACE: DARK_SURFACE,
  ACTION: DARK_ACTION,
  TEXT: DARK_TEXT,
  ERROR: DARK_ERROR,
} = THEME_CONTRACT.DARK

const { COLOR_SCHEME_LIGHT, COLOR_SCHEME_DARK, ACTION_PROPERTY } = THEME_BROWSER
const { MIN_TEXT_CONTRAST } = THEME_CONTRACT

test.use({ colorScheme: COLOR_SCHEME_LIGHT })

const fillCredentials = async (page: Page) => {
  await page.getByLabel(ID_LABEL, { exact: true }).fill(ID)
  await page.getByLabel(TOKEN_LABEL, { exact: true }).fill(TOKEN)
}

const rejectLogin = (page: Page) =>
  page.route(LOGIN_API, (route) =>
    route.fulfill({
      status: RATE_LIMIT_STATUS,
      contentType: JSON_CONTENT_TYPE,
      body: JSON.stringify({ status: RESPONSE_ERROR, code: RATE_LIMIT_CODE }),
    }),
  )

for (const viewport of LOGIN_UI_VIEWPORTS) {
  test(`MAX login fits ${viewport.width}x${viewport.height} with long errors`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport)
    await rejectLogin(page)
    await page.goto(LOGIN)
    const field = page.getByLabel(ID_LABEL, { exact: true })
    const submit = page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true })
    const eye = page.getByRole(ROLE_BUTTON, { name: SHOW_TOKEN, exact: true })
    const card = page.locator(MAIN_SELECTOR)
    await expect(field).toBeEnabled()
    const cardStyle = await readStyles(card)
    expect(cardStyle.background).toBe(SURFACE)
    expect(cardStyle.shadow).not.toBe(STYLE_NONE)
    const canvas = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    )
    expect(canvas).toBe(CANVAS)
    const textColors = await card.evaluate(
      (element, selector) =>
        [...element.querySelectorAll(selector)]
          .filter((node) => node.textContent?.trim())
          .map((node) => getComputedStyle(node).color),
      TEXT_SELECTOR,
    )
    for (const color of textColors)
      expect(
        textContrast({ color, background: SURFACE }),
      ).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST)
    expect((await readStyles(submit)).background).toBe(ACTION)
    expect(textContrast(await readStyles(submit))).toBeGreaterThanOrEqual(
      MIN_TEXT_CONTRAST,
    )
    expect((await readStyles(field)).fontSize).toBeGreaterThanOrEqual(
      FIELD_MIN_FONT_SIZE,
    )
    for (const control of [eye, submit]) {
      const box = (await control.boundingBox())!
      expect(box.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
      expect(box.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
    }
    await page.screenshot({
      path: testInfo.outputPath(
        `login-${viewport.width}-${viewport.height}.png`,
      ),
      fullPage: true,
    })
    await fillCredentials(page)
    await submit.click()
    const error = page.getByText(RATE_LIMITED, { exact: true })
    await expect(error).toBeVisible()
    expect((await readStyles(error)).color).toBe(ERROR)
    expect(
      textContrast({ color: ERROR, background: SURFACE }),
    ).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST)
    const geometry = await page.evaluate(
      ({ mainSelector, controlSelector }) => {
        const backdrop = getComputedStyle(document.body)
        const cardBox = document
          .querySelector(mainSelector)!
          .getBoundingClientRect()
        const controls = [...document.querySelectorAll(controlSelector)].map(
          (element) => {
            const box = element.getBoundingClientRect()
            return { left: box.left, right: box.right }
          },
        )

        return {
          width: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          scrollHeight: document.documentElement.scrollHeight,
          backdropHeight: Number.parseFloat(backdrop.height),
          cardWidth: cardBox.width,
          cardDocumentTop: cardBox.top + scrollY,
          controls,
        }
      },
      {
        mainSelector: MAIN_SELECTOR,
        controlSelector: CONTROL_SELECTOR,
      },
    )
    expect(geometry.scrollWidth).toBeLessThanOrEqual(viewport.width)
    expect(geometry.backdropHeight + GEOMETRY_TOLERANCE).toBeGreaterThanOrEqual(
      geometry.scrollHeight,
    )
    expect(geometry.cardWidth).toBeLessThanOrEqual(CARD_MAX_WIDTH)
    expect(geometry.cardDocumentTop).toBeGreaterThanOrEqual(0)
    for (const control of geometry.controls) {
      expect(control.left).toBeGreaterThanOrEqual(0)
      expect(control.right).toBeLessThanOrEqual(
        geometry.width + GEOMETRY_TOLERANCE,
      )
    }
    await submit.scrollIntoViewIfNeeded()
    await expect(submit).toBeInViewport()
    await page.screenshot({
      path: testInfo.outputPath(
        `login-${viewport.width}-${viewport.height}-error.png`,
      ),
      fullPage: true,
    })
  })
}

test('MAX login allows enlarged text and vertical scrolling', async ({
  page,
}) => {
  const narrowViewport = LOGIN_UI_VIEWPORTS[0]
  await page.setViewportSize(narrowViewport)
  await page.goto(LOGIN)
  await page.addStyleTag({ content: ENLARGED_TEXT_STYLE })
  await expect(page.getByLabel(ID_LABEL, { exact: true })).toBeEnabled()
  await page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }).click()
  const width = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(width).toBeLessThanOrEqual(narrowViewport.width)
  const submit = page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true })
  await submit.scrollIntoViewIfNeeded()
  await expect(submit).toBeInViewport()
})

for (const reducedMotion of [MEDIA_NORMAL, MEDIA_REDUCE]) {
  test(`MAX login announces pending request with ${reducedMotion} motion`, async ({
    page,
  }, testInfo) => {
    let posts = 0
    let release: (() => void) | undefined
    await page.emulateMedia({ reducedMotion })
    await page.route(LOGIN_API, async (route) => {
      posts += 1
      await new Promise<void>((resolve) => void (release = resolve))
      await route.fulfill({
        status: RATE_LIMIT_STATUS,
        contentType: JSON_CONTENT_TYPE,
        body: JSON.stringify({ status: RESPONSE_ERROR, code: RATE_LIMIT_CODE }),
      })
    })
    await page.goto(LOGIN)
    await fillCredentials(page)
    const submit = page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true })
    const before = (await submit.boundingBox())!
    await submit.click()
    try {
      const pending = page.getByRole(ROLE_BUTTON, {
        name: PENDING,
        exact: true,
      })
      await expect(pending).toBeDisabled()
      await expect(pending).toHaveAttribute(ATTR_ARIA_BUSY, BOOLEAN_TRUE)
      const loader = pending.locator(LOADER_SELECTOR)
      await expect(loader).toBeVisible()
      const animation = (await readStyles(loader)).animation
      if (reducedMotion === MEDIA_REDUCE) expect(animation).toBe(STYLE_NONE)
      else expect(animation).not.toBe(STYLE_NONE)
      const status = page.getByRole(ROLE_STATUS)
      await expect(status).toHaveText(PENDING)
      expect(
        await status.evaluate(
          (element, attribute) =>
            element.parentElement!.hasAttribute(attribute),
          ATTR_ARIA_BUSY,
        ),
      ).toBe(false)
      await expect(page.getByLabel(ID_LABEL, { exact: true })).toBeDisabled()
      await page.keyboard.press(KEY_ENTER)
      expect(posts).toBe(1)
      const after = (await pending.boundingBox())!
      expect(Math.abs(after.height - before.height)).toBeLessThanOrEqual(
        GEOMETRY_TOLERANCE,
      )
      expect(Math.abs(after.width - before.width)).toBeLessThanOrEqual(
        GEOMETRY_TOLERANCE,
      )
      expect(textContrast(await readStyles(pending))).toBeGreaterThanOrEqual(
        MIN_TEXT_CONTRAST,
      )
      await page.screenshot({
        path: testInfo.outputPath(`login-pending-${reducedMotion}.png`),
        fullPage: true,
      })
    } finally {
      release?.()
    }
    await expect(submit).toBeEnabled()
    await expect(submit.locator(LOADER_SELECTOR)).toHaveCount(0)
    await expect(page.getByRole(ROLE_STATUS)).toHaveText(EMPTY_STRING)
    await expect(page.getByText(RATE_LIMITED, { exact: true })).toBeVisible()
    expect(posts).toBe(1)
  })
}

for (const forcedColors of [FORCED_COLORS_NONE, FORCED_COLORS_ACTIVE]) {
  test(`MAX login keeps keyboard and error focus visible with forced colors ${forcedColors}`, async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors })
    await page.goto(LOGIN)
    const field = page.getByLabel(ID_LABEL, { exact: true })
    await expect(field).toBeEnabled()
    await page.keyboard.press(KEY_TAB)
    await expect(field).toBeFocused()
    const focused = await readStyles(field)
    expect(focused.outlineStyle).toBe(OUTLINE_SOLID)
    expect(focused.outlineWidth).toBeGreaterThan(0)
    if (forcedColors === FORCED_COLORS_NONE) {
      expect(focused.border).toBe(ACTION)
      expect(focused.outline).toBe(ACTION)
      expect(focused.shadow).not.toBe(STYLE_NONE)
    }
    await field.press(KEY_ENTER)
    const invalid = await readStyles(field)
    expect(invalid.outlineWidth).toBeGreaterThan(0)
    if (forcedColors === FORCED_COLORS_NONE) {
      expect(invalid.border).toBe(ERROR)
      expect(invalid.outline).toBe(ERROR)
    }
  })
}

test('MAX theme is shared across login, home and logout navigation', async ({
  page,
}) => {
  await page.goto(LOGIN)
  await fillCredentials(page)
  await page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }).click()
  await expect(page).toHaveURL(HOME)
  const search = page.getByRole(ROLE_BUTTON, {
    name: SEARCH_SUBMIT,
    exact: true,
  })
  await expect(search).toBeVisible()
  expect((await readStyles(search)).background).toBe(ACTION)
  const homeStyles = await search.evaluate(
    (element, property) => ({
      theme: getComputedStyle(element).getPropertyValue(property),
      background: getComputedStyle(document.body).backgroundColor,
    }),
    ACTION_PROPERTY,
  )
  expect(homeStyles.theme.trim()).not.toBe(EMPTY_STRING)
  expect(homeStyles.background).toBe(CANVAS)
  await expect(page.getByLabel(PHONE_LABEL, { exact: true })).toBeEnabled()
  await expect(
    page.getByRole(ROLE_BUTTON, { name: LOGOUT, exact: true }),
  ).toBeVisible()
  await page.emulateMedia({ colorScheme: COLOR_SCHEME_DARK })
  expect((await readStyles(search)).background).toBe(DARK_ACTION)
  expect(
    await page.evaluate(() => getComputedStyle(document.body).backgroundColor),
  ).toBe(DARK_CANVAS)
  await page.getByRole(ROLE_BUTTON, { name: LOGOUT, exact: true }).click()
  await expect(page).toHaveURL(LOGIN)
  expect((await readStyles(page.locator(MAIN_SELECTOR))).background).toBe(
    DARK_SURFACE,
  )
})

for (const viewport of VIEWPORTS) {
  test(`MAX login follows device theme and keeps compact errors at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport)
    await page.goto(LOGIN)
    const card = page.locator(MAIN_SELECTOR)
    const field = page.getByLabel(ID_LABEL, { exact: true })
    const token = page.getByLabel(TOKEN_LABEL, { exact: true })
    const submit = page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true })
    await expect(field).toBeEnabled()
    await token.fill(TOKEN)
    await page.emulateMedia({ colorScheme: COLOR_SCHEME_DARK })
    expect((await readStyles(card)).background).toBe(DARK_SURFACE)
    expect((await readStyles(card)).color).toBe(DARK_TEXT)
    expect((await readStyles(field)).background).toBe(DARK_SURFACE)
    expect((await readStyles(submit)).background).toBe(DARK_ACTION)
    expect(textContrast(await readStyles(submit))).toBeGreaterThanOrEqual(
      MIN_TEXT_CONTRAST,
    )
    const canvas = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    )
    expect(canvas).toBe(DARK_CANVAS)
    await submit.click()
    const error = page.getByText(ID_ERROR, { exact: true })
    await expect(error).toBeVisible()
    const errorStyle = await readStyles(error)
    expect(errorStyle.fontSize).toBe(FIELD_ERROR_FONT_SIZE)
    expect(errorStyle.color).toBe(DARK_ERROR)
    expect(
      textContrast({ color: errorStyle.color, background: DARK_SURFACE }),
    ).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST)
    const cabinet = page.getByRole(ROLE_LINK, {
      name: CABINET_LABEL,
      exact: true,
    })
    expect(
      textContrast({
        color: (await readStyles(cabinet)).color,
        background: DARK_SURFACE,
      }),
    ).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST)
    await cabinet.hover()
    expect(
      textContrast({
        color: (await readStyles(cabinet)).color,
        background: DARK_SURFACE,
      }),
    ).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST)
    await page.screenshot({
      path: testInfo.outputPath(`login-dark-${viewport.width}.png`),
      fullPage: true,
    })
    await page.emulateMedia({ colorScheme: COLOR_SCHEME_LIGHT })
    expect((await readStyles(card)).background).toBe(SURFACE)
    expect((await readStyles(error)).color).toBe(ERROR)
    expect((await readStyles(error)).fontSize).toBe(FIELD_ERROR_FONT_SIZE)
    await expect(token).toHaveValue(TOKEN)
    await field.fill(ID)
    await expect(error).toHaveCount(0)
    await expect(page).toHaveURL(LOGIN)
  })
}

for (const viewport of VIEWPORTS) {
  test(`MAX login reserves field errors without resizing at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.goto(LOGIN)
    const card = page.locator(MAIN_SELECTOR)
    const field = page.getByLabel(ID_LABEL, { exact: true })
    const token = page.getByLabel(TOKEN_LABEL, { exact: true })
    await expect(field).toBeEnabled()
    const initial = await card.boundingBox()
    await page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }).click()
    await expect(page.getByText(ID_ERROR, { exact: true })).toBeVisible()
    const withErrors = await card.boundingBox()
    expect(Math.abs(withErrors!.height - initial!.height)).toBeLessThanOrEqual(
      GEOMETRY_TOLERANCE,
    )
    expect(Math.abs(withErrors!.y - initial!.y)).toBeLessThanOrEqual(
      GEOMETRY_TOLERANCE,
    )
    await field.fill(ID)
    await token.fill(TOKEN)
    const corrected = await card.boundingBox()
    expect(Math.abs(corrected!.height - initial!.height)).toBeLessThanOrEqual(
      GEOMETRY_TOLERANCE,
    )
  })
}
