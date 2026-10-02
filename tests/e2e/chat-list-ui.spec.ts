import { expect, test } from '@playwright/test'
import type { Locator, Page, Route } from '@playwright/test'
import { readStyles, textContrast } from './ui-theme.helpers'
import {
  CONVERSATION_CONTRACT,
  CONVERSATION_FIXTURES,
  CREDENTIALS,
  LOGIN_API_CONTRACT,
  MIN_TOUCH_TARGET_SIZE,
  RECIPIENT_API_CONTRACT,
  RECIPIENT_CONTRACT,
  LOGIN_CONTRACT,
  ROUTES,
  THEME_CONTRACT,
  THEME_BROWSER,
  TEST_UI,
} from '../constants'
import {
  CHAT_LIST_EXPECTATIONS,
  CHAT_LIST_LONG_FIXTURE,
  CHAT_LIST_FIXTURES,
  CHAT_LIST_UI,
} from './chat-list-ui.constants'

const { ID, TOKEN } = CREDENTIALS
const { ID_LABEL, TOKEN_LABEL, SUBMIT } = LOGIN_CONTRACT
const { LOGIN, HOME } = ROUTES
const { MIN_TEXT_CONTRAST } = THEME_CONTRACT
const { BACK, EMPTY_HEADING } = CONVERSATION_CONTRACT
const { phone, widths, summaryWidths, viewportHeight, textScales } =
  CONVERSATION_FIXTURES
const {
  OK_STATUS,
  UNAVAILABLE_STATUS,
  UNAUTHORIZED_STATUS,
  RATE_LIMIT_STATUS,
  RESPONSE_OK,
  RESPONSE_ERROR,
  SERVICE_UNAVAILABLE,
  RATE_LIMITED,
} = LOGIN_API_CONTRACT
const { SESSION_REQUIRED } = RECIPIENT_API_CONTRACT
const { PHONE_LABEL } = RECIPIENT_CONTRACT
const { COLOR_SCHEME_LIGHT, COLOR_SCHEME_DARK, REDUCED_MOTION } = THEME_BROWSER
const {
  ROLE_REGION,
  ROLE_BUTTON,
  ROLE_STATUS,
  ROLE_LIST,
  ROLE_LIST_ITEM,
  ROLE_HEADING,
  ROLE_ALERT,
  ROLE_COMPLEMENTARY,
  KEY_ENTER,
  KEY_TAB,
  STYLE_NONE,
  PARAGRAPH_SELECTOR,
  PARENT_SELECTOR,
  SVG_SELECTOR,
} = TEST_UI
const { LABELS, USERNAME_INITIAL, OMITTED_USERNAME } = CHAT_LIST_EXPECTATIONS
const { COUNT, ID_PREFIX, LABEL_PREFIX, LABEL_SUFFIX } = CHAT_LIST_LONG_FIXTURE
const {
  API,
  SCOPE_HEADER,
  LIST,
  LOADING,
  EMPTY,
  ERROR,
  RATE_LIMIT,
  RETRY_PENDING,
  ERROR_HINT,
  REFRESH,
  MAX_RETRY_LABEL_LINES,
  INITIALS_SELECTOR,
  INITIAL_SELECTOR,
  INITIAL_ATTRIBUTE,
  UNSUPPORTED_DECORATION_SELECTOR,
} = CHAT_LIST_UI

const panel = (page: Page) =>
  page.getByRole(ROLE_REGION, { name: BACK, exact: true })

const signIn = async (page: Page) => {
  await page.goto(LOGIN)
  await page.getByLabel(ID_LABEL).fill(ID)
  await page.getByLabel(TOKEN_LABEL).fill(TOKEN)
  await page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }).click()
  await expect(page).toHaveURL(HOME)
}

const fulfill = ({
  route,
  chats = CHAT_LIST_FIXTURES,
  status = OK_STATUS,
  code,
}: {
  route: Route
  chats?: typeof CHAT_LIST_FIXTURES
  status?: number
  code?: string
}) =>
  route.fulfill({
    status,
    json: code
      ? { status: RESPONSE_ERROR, code }
      : {
          status: RESPONSE_OK,
          connectionScope: route.request().headers()[SCOPE_HEADER],
          chats,
        },
  })

const readResolvedColors = (locator: Locator) =>
  locator.evaluate((element) => {
    const style = getComputedStyle(element)
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    const context = canvas.getContext('2d')!
    // Canvas resolves color-mix()/color(srgb ...) to sRGB channels for contrast.
    const normalize = (color: string) => {
      context.fillStyle = color
      context.fillRect(0, 0, 1, 1)
      const [red, green, blue] = context.getImageData(0, 0, 1, 1).data

      return `rgb(${red}, ${green}, ${blue})`
    }

    return {
      color: normalize(style.color),
      background: normalize(style.backgroundColor),
    }
  })

test('chat list: initial loading is distinct from empty and does not block search', async ({
  page,
}) => {
  let pending: Route | undefined
  await page.route(API, (route) => {
    pending = route
  })
  await signIn(page)
  await expect(
    page.getByRole(ROLE_STATUS).filter({ hasText: LOADING }),
  ).toBeVisible()
  await expect(page.getByText(EMPTY, { exact: true })).toHaveCount(0)
  await expect(panel(page).getByRole(ROLE_BUTTON)).toHaveCount(0)
  await page.getByLabel(PHONE_LABEL, { exact: true }).fill(phone)
  await expect.poll(() => Boolean(pending)).toBe(true)
  await fulfill({ route: pending!, chats: [] })
  await expect(page.getByText(EMPTY, { exact: true })).toBeVisible()
  await expect(page.getByText(LOADING, { exact: true })).toHaveCount(0)
  await expect(page.getByRole(ROLE_LIST, { name: LIST })).toHaveCount(0)
  await expect(panel(page).getByRole(ROLE_BUTTON)).toHaveCount(0)
})

test('chat list: real signatures follow fallbacks with functional selection and without fabricated previews', async ({
  page,
}, testInfo) => {
  await page.route(API, (route) => fulfill({ route }))
  await signIn(page)
  const list = page.getByRole(ROLE_LIST, { name: LIST })
  await expect(panel(page).getByRole(ROLE_BUTTON)).toHaveCount(
    CHAT_LIST_FIXTURES.length,
  )
  await expect(list.getByRole(ROLE_LIST_ITEM)).toHaveText([...LABELS])
  await expect(list.locator(INITIALS_SELECTOR)).toHaveCount(
    CHAT_LIST_FIXTURES.length,
  )
  await expect(list.locator(INITIAL_SELECTOR).nth(1)).toHaveAttribute(
    INITIAL_ATTRIBUTE,
    USERNAME_INITIAL,
  )
  await expect(list.getByRole(ROLE_BUTTON)).toHaveCount(
    CHAT_LIST_FIXTURES.length,
  )
  await expect(list.locator(UNSUPPORTED_DECORATION_SELECTOR)).toHaveCount(0)
  await expect(list.getByText(OMITTED_USERNAME, { exact: true })).toHaveCount(0)
  await expect(
    page.getByRole(ROLE_HEADING, { name: EMPTY_HEADING, exact: true }),
  ).toBeVisible()
  for (const colorScheme of [COLOR_SCHEME_LIGHT, COLOR_SCHEME_DARK]) {
    await page.emulateMedia({ colorScheme })
    for (const width of summaryWidths) {
      await page.setViewportSize({ width, height: viewportHeight })
      await page.screenshot({
        path: testInfo.outputPath(`list-data-${colorScheme}-${width}.png`),
        fullPage: true,
      })
    }
  }
})

test('chat list: initial failure keeps a stable error card during one retry', async ({
  page,
}) => {
  let calls = 0
  let pending: Route | undefined
  await page.route(API, (route) => {
    calls += 1
    if (calls === 1)
      return fulfill({
        route,
        status: UNAVAILABLE_STATUS,
        code: SERVICE_UNAVAILABLE,
      })
    pending = route
  })
  await signIn(page)
  const area = panel(page)
  await expect(area.getByRole(ROLE_ALERT)).toContainText(ERROR)
  await expect(area.getByRole(ROLE_ALERT)).toContainText(ERROR_HINT)
  await expect(page.getByText(EMPTY, { exact: true })).toHaveCount(0)
  expect(calls).toBe(1)
  const retry = area.getByRole(ROLE_BUTTON)
  await expect(retry).toHaveAccessibleName(REFRESH)
  const cardBefore = await area.boundingBox()
  const buttonBefore = await retry.boundingBox()
  await retry.focus()
  await expect(retry).toBeFocused()
  await retry.press(KEY_ENTER)
  await expect(retry).toBeDisabled()
  await expect(retry).toHaveAccessibleName(RETRY_PENDING)
  await expect(area.getByRole(ROLE_ALERT)).toContainText(ERROR)
  await expect(area.getByRole(ROLE_STATUS)).toContainText(RETRY_PENDING)
  await expect(page.getByRole(ROLE_LIST, { name: LIST })).toHaveCount(0)
  await expect(page.getByText(LOADING, { exact: true })).toHaveCount(0)
  expect(await area.boundingBox()).toEqual(cardBefore)
  expect(await retry.boundingBox()).toEqual(buttonBefore)
  await retry.press(KEY_ENTER)
  await expect.poll(() => calls).toBe(2)
  await fulfill({ route: pending! })
  await expect(
    page.getByRole(ROLE_LIST, { name: LIST }).getByRole(ROLE_LIST_ITEM),
  ).toHaveCount(CHAT_LIST_FIXTURES.length)
  await expect(area.getByRole(ROLE_ALERT)).toHaveCount(0)
  await expect(area.getByRole(ROLE_BUTTON)).toHaveCount(
    CHAT_LIST_FIXTURES.length,
  )
  expect(calls).toBe(2)
})

test('chat list: failed retry keeps the error and a later empty success clears it', async ({
  page,
}) => {
  let calls = 0
  let pending: Route | undefined
  await page.route(API, (route) => {
    calls += 1
    if (calls === 1)
      return fulfill({
        route,
        status: UNAVAILABLE_STATUS,
        code: SERVICE_UNAVAILABLE,
      })
    pending = route
  })
  await signIn(page)
  const area = panel(page)
  const retry = area.getByRole(ROLE_BUTTON)
  await expect(area.getByRole(ROLE_ALERT)).toContainText(ERROR)
  await retry.click()
  await expect.poll(() => calls).toBe(2)
  await fulfill({
    route: pending!,
    status: RATE_LIMIT_STATUS,
    code: RATE_LIMITED,
  })
  await expect(area.getByRole(ROLE_ALERT)).toContainText(RATE_LIMIT)
  await expect(retry).toHaveAccessibleName(REFRESH)
  await expect(retry).toBeEnabled()
  await expect(page.getByText(EMPTY, { exact: true })).toHaveCount(0)
  await retry.click()
  await expect.poll(() => calls).toBe(3)
  await expect(area.getByRole(ROLE_ALERT)).toContainText(RATE_LIMIT)
  await fulfill({ route: pending!, chats: [] })
  await expect(page.getByText(EMPTY, { exact: true })).toBeVisible()
  await expect(page.getByRole(ROLE_LIST, { name: LIST })).toHaveCount(0)
  await expect(area.getByRole(ROLE_ALERT)).toHaveCount(0)
  await expect(area.getByRole(ROLE_BUTTON)).toHaveCount(0)
})

test('chat list: rate limiting is an error rather than an absent conversation', async ({
  page,
}) => {
  await page.route(API, (route) =>
    fulfill({ route, status: RATE_LIMIT_STATUS, code: RATE_LIMITED }),
  )
  await signIn(page)
  await expect(panel(page).getByRole(ROLE_ALERT)).toContainText(RATE_LIMIT)
  await expect(page.getByText(EMPTY, { exact: true })).toHaveCount(0)
  await expect(
    page.getByRole(ROLE_BUTTON, { name: REFRESH, exact: true }),
  ).toBeEnabled()
})

test('chat list: long lists remain reachable across themes, resize and enlarged text', async ({
  page,
}, testInfo) => {
  const chats = Array.from({ length: COUNT }, (_, index) => ({
    chatId: `${ID_PREFIX}${index}`,
    name: `${LABEL_PREFIX} ${index} ${LABEL_SUFFIX}`,
    username: null,
    phone: null,
  }))
  let calls = 0
  await page.route(API, (route) => {
    calls += 1
    return fulfill({ route, chats })
  })
  await signIn(page)
  const list = page.getByRole(ROLE_LIST, { name: LIST })
  await expect(list.getByRole(ROLE_LIST_ITEM)).toHaveCount(COUNT)
  const field = page.getByLabel(PHONE_LABEL, { exact: true })
  await field.fill(phone)
  for (const scale of textScales) {
    const style = await page.addStyleTag({
      content: `html { font-size: ${scale}% }`,
    })
    for (const colorScheme of [COLOR_SCHEME_LIGHT, COLOR_SCHEME_DARK]) {
      await page.emulateMedia({ colorScheme })
      for (const width of widths) {
        await page.setViewportSize({ width, height: viewportHeight })
        await expect(field).toHaveValue(phone)
        await list.getByRole(ROLE_LIST_ITEM).last().scrollIntoViewIfNeeded()
        await expect(list.getByRole(ROLE_LIST_ITEM).last()).toBeInViewport()
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true)
      }
      const text = await readStyles(list.getByRole(ROLE_LIST_ITEM).first())
      const surface = await readStyles(page.getByRole(ROLE_COMPLEMENTARY))
      expect(
        textContrast({ color: text.color, background: surface.background }),
      ).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST)
      await page.screenshot({
        path: testInfo.outputPath(`list-${colorScheme}-text-${scale}.png`),
        fullPage: true,
      })
    }
    await style.evaluate((element) => element.parentNode?.removeChild(element))
  }
  expect(calls).toBe(1)
  await expect(panel(page).getByRole(ROLE_BUTTON)).toHaveCount(chats.length)
})

test('chat list: session rejection closes the displayed data and returns to login', async ({
  page,
}) => {
  let pending: Route | undefined
  await page.route(API, (route) => {
    pending = route
  })
  await signIn(page)
  await expect(page.getByText(LOADING, { exact: true })).toBeVisible()
  await expect.poll(() => Boolean(pending)).toBe(true)
  await fulfill({
    route: pending!,
    status: UNAUTHORIZED_STATUS,
    code: SESSION_REQUIRED,
  })
  await expect(page).toHaveURL(LOGIN)
  await expect(page.getByRole(ROLE_LIST, { name: LIST })).toHaveCount(0)
})

test('chat list: recovery is readable and stable across themes and enlarged mobile text', async ({
  page,
}, testInfo) => {
  let calls = 0
  let pending: Route | undefined
  await page.route(API, (route) => {
    calls += 1
    if (calls === 1)
      return fulfill({
        route,
        status: UNAVAILABLE_STATUS,
        code: SERVICE_UNAVAILABLE,
      })
    pending = route
  })
  await signIn(page)
  const area = panel(page)
  const alert = area.getByRole(ROLE_ALERT)
  const retry = area.getByRole(ROLE_BUTTON)
  await expect(alert).toContainText(ERROR)
  for (const scale of textScales) {
    const style = await page.addStyleTag({
      content: `html { font-size: ${scale}% }`,
    })
    for (const colorScheme of [COLOR_SCHEME_LIGHT, COLOR_SCHEME_DARK]) {
      await page.emulateMedia({ colorScheme })
      for (const width of summaryWidths) {
        await page.setViewportSize({ width, height: viewportHeight })
        await retry.scrollIntoViewIfNeeded()
        await expect(retry).toBeInViewport()
        await page.keyboard.press(KEY_TAB)
        await retry.focus()
        await expect(retry).toBeFocused()
        const buttonStyles = await readStyles(retry)
        expect(buttonStyles.outlineStyle).not.toBe(STYLE_NONE)
        const labelLines = await retry
          .getByText(REFRESH, { exact: true })
          .evaluate(
            (label) =>
              label.getBoundingClientRect().height /
              Number.parseFloat(getComputedStyle(label).lineHeight),
          )
        expect(labelLines).toBeLessThanOrEqual(MAX_RETRY_LABEL_LINES)
        const buttonColors = await readResolvedColors(retry)
        expect(textContrast(buttonColors)).toBeGreaterThanOrEqual(
          MIN_TEXT_CONTRAST,
        )
        const cardColors = await readResolvedColors(
          alert.locator(PARENT_SELECTOR),
        )
        for (const paragraph of await alert.locator(PARAGRAPH_SELECTOR).all()) {
          const textColors = await readResolvedColors(paragraph)
          expect(
            textContrast({
              color: textColors.color,
              background: cardColors.background,
            }),
          ).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST)
        }
        const buttonBox = await retry.boundingBox()
        expect(buttonBox?.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
        expect(buttonBox?.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true)
        await page.screenshot({
          path: testInfo.outputPath(
            `recovery-${colorScheme}-${width}-text-${scale}.png`,
          ),
          fullPage: true,
        })
      }
    }
    await style.evaluate((element) => element.parentNode?.removeChild(element))
  }
  expect(calls).toBe(1)
  await page.emulateMedia({ reducedMotion: REDUCED_MOTION })
  const cardBefore = await area.boundingBox()
  const buttonBefore = await retry.boundingBox()
  await retry.click()
  await expect(retry).toBeDisabled()
  await expect(retry).toHaveAccessibleName(RETRY_PENDING)
  expect(await area.boundingBox()).toEqual(cardBefore)
  expect(await retry.boundingBox()).toEqual(buttonBefore)
  expect(
    await retry
      .locator(SVG_SELECTOR)
      .evaluate((icon) => getComputedStyle(icon).animationName),
  ).toBe(STYLE_NONE)
  await expect.poll(() => calls).toBe(2)
  await fulfill({ route: pending! })
  await expect(area.getByRole(ROLE_ALERT)).toHaveCount(0)
})
