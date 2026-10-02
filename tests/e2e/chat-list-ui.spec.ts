import { expect, test } from '@playwright/test'
import type { Locator, Page, Route } from '@playwright/test'
import { readStyles, textContrast } from './ui-theme.helpers'
import {
  CREDENTIALS,
  LOGIN_CONTRACT,
  ROUTES,
  THEME_CONTRACT,
} from '../constants'
import { CHAT_LIST_FIXTURES, CHAT_LIST_UI } from './chat-list-ui.constants'

const { ID, TOKEN } = CREDENTIALS
const { ID_LABEL, TOKEN_LABEL, SUBMIT } = LOGIN_CONTRACT
const { LOGIN, HOME } = ROUTES
const { MIN_TEXT_CONTRAST } = THEME_CONTRACT
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
} = CHAT_LIST_UI

const panel = (page: Page) =>
  page.getByRole('region', { name: 'Чаты', exact: true })

const signIn = async (page: Page) => {
  await page.goto(LOGIN)
  await page.getByLabel(ID_LABEL).fill(ID)
  await page.getByLabel(TOKEN_LABEL).fill(TOKEN)
  await page.getByRole('button', { name: SUBMIT, exact: true }).click()
  await expect(page).toHaveURL(HOME)
}

const fulfill = ({
  route,
  chats = CHAT_LIST_FIXTURES,
  status = 200,
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
      ? { status: 'error', code }
      : {
          status: 'ok',
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
    page.getByRole('status').filter({ hasText: LOADING }),
  ).toBeVisible()
  await expect(page.getByText(EMPTY, { exact: true })).toHaveCount(0)
  await expect(panel(page).getByRole('button')).toHaveCount(0)
  await page.getByLabel('Номер телефона', { exact: true }).fill('12025550123')
  await expect.poll(() => Boolean(pending)).toBe(true)
  await fulfill({ route: pending!, chats: [] })
  await expect(page.getByText(EMPTY, { exact: true })).toBeVisible()
  await expect(page.getByText(LOADING, { exact: true })).toHaveCount(0)
  await expect(page.getByRole('list', { name: LIST })).toHaveCount(0)
  await expect(panel(page).getByRole('button')).toHaveCount(0)
})

test('chat list: real signatures follow fallbacks without fabricated previews or inert buttons', async ({
  page,
}, testInfo) => {
  await page.route(API, (route) => fulfill({ route }))
  await signIn(page)
  const list = page.getByRole('list', { name: LIST })
  await expect(panel(page).getByRole('button')).toHaveCount(0)
  await expect(list.getByRole('listitem')).toHaveText([
    'Анна Демо',
    '@recipient_demo',
    '12025550103',
    'chat-4',
    'Анна Демо',
    '<b>Получатель</b>',
  ])
  await expect(list.locator('[aria-hidden][data-initial]')).toHaveCount(6)
  await expect(list.locator('[data-initial]').nth(1)).toHaveAttribute(
    'data-initial',
    'R',
  )
  await expect(list.getByRole('button')).toHaveCount(0)
  await expect(list.locator('img, time, b')).toHaveCount(0)
  await expect(list.getByText('@anna_demo', { exact: true })).toHaveCount(0)
  await expect(
    page.getByRole('heading', { name: 'Выберите чат', exact: true }),
  ).toBeVisible()
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme })
    for (const width of [320, 1280]) {
      await page.setViewportSize({ width, height: 800 })
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
      return fulfill({ route, status: 503, code: 'service_unavailable' })
    pending = route
  })
  await signIn(page)
  const area = panel(page)
  await expect(area.getByRole('alert')).toContainText(ERROR)
  await expect(area.getByRole('alert')).toContainText(ERROR_HINT)
  await expect(page.getByText(EMPTY, { exact: true })).toHaveCount(0)
  expect(calls).toBe(1)
  const retry = area.getByRole('button')
  await expect(retry).toHaveAccessibleName(REFRESH)
  const cardBefore = await area.boundingBox()
  const buttonBefore = await retry.boundingBox()
  await retry.focus()
  await expect(retry).toBeFocused()
  await retry.press('Enter')
  await expect(retry).toBeDisabled()
  await expect(retry).toHaveAccessibleName(RETRY_PENDING)
  await expect(area.getByRole('alert')).toContainText(ERROR)
  await expect(area.getByRole('status')).toContainText(RETRY_PENDING)
  await expect(page.getByRole('list', { name: LIST })).toHaveCount(0)
  await expect(page.getByText(LOADING, { exact: true })).toHaveCount(0)
  expect(await area.boundingBox()).toEqual(cardBefore)
  expect(await retry.boundingBox()).toEqual(buttonBefore)
  await retry.press('Enter')
  await expect.poll(() => calls).toBe(2)
  await fulfill({ route: pending! })
  await expect(
    page.getByRole('list', { name: LIST }).getByRole('listitem'),
  ).toHaveCount(6)
  await expect(area.getByRole('alert')).toHaveCount(0)
  await expect(area.getByRole('button')).toHaveCount(0)
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
      return fulfill({ route, status: 503, code: 'service_unavailable' })
    pending = route
  })
  await signIn(page)
  const area = panel(page)
  const retry = area.getByRole('button')
  await expect(area.getByRole('alert')).toContainText(ERROR)
  await retry.click()
  await expect.poll(() => calls).toBe(2)
  await fulfill({ route: pending!, status: 429, code: 'rate_limited' })
  await expect(area.getByRole('alert')).toContainText(RATE_LIMIT)
  await expect(retry).toHaveAccessibleName(REFRESH)
  await expect(retry).toBeEnabled()
  await expect(page.getByText(EMPTY, { exact: true })).toHaveCount(0)
  await retry.click()
  await expect.poll(() => calls).toBe(3)
  await expect(area.getByRole('alert')).toContainText(RATE_LIMIT)
  await fulfill({ route: pending!, chats: [] })
  await expect(page.getByText(EMPTY, { exact: true })).toBeVisible()
  await expect(page.getByRole('list', { name: LIST })).toHaveCount(0)
  await expect(area.getByRole('alert')).toHaveCount(0)
  await expect(area.getByRole('button')).toHaveCount(0)
})

test('chat list: rate limiting is an error rather than an absent conversation', async ({
  page,
}) => {
  await page.route(API, (route) =>
    fulfill({ route, status: 429, code: 'rate_limited' }),
  )
  await signIn(page)
  await expect(panel(page).getByRole('alert')).toContainText(RATE_LIMIT)
  await expect(page.getByText(EMPTY, { exact: true })).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: REFRESH, exact: true }),
  ).toBeEnabled()
})

test('chat list: long lists remain reachable across themes, resize and enlarged text', async ({
  page,
}, testInfo) => {
  const chats = Array.from({ length: 50 }, (_, index) => ({
    chatId: `long-chat-${index}`,
    name: `Получатель ${index} ${'д'.repeat(100)}`,
    username: null,
    phone: null,
  }))
  let calls = 0
  await page.route(API, (route) => {
    calls += 1
    return fulfill({ route, chats })
  })
  await signIn(page)
  const list = page.getByRole('list', { name: LIST })
  await expect(list.getByRole('listitem')).toHaveCount(50)
  const field = page.getByLabel('Номер телефона', { exact: true })
  await field.fill('12025550123')
  for (const scale of [100, 200]) {
    const style = await page.addStyleTag({
      content: `html { font-size: ${scale}% }`,
    })
    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme })
      for (const width of [320, 360, 390, 680, 681, 768, 1280]) {
        await page.setViewportSize({ width, height: 800 })
        await expect(field).toHaveValue('12025550123')
        await list.getByRole('listitem').last().scrollIntoViewIfNeeded()
        await expect(list.getByRole('listitem').last()).toBeInViewport()
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true)
      }
      const text = await readStyles(list.getByRole('listitem').first())
      const surface = await readStyles(page.getByRole('complementary'))
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
  await expect(panel(page).getByRole('button')).toHaveCount(0)
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
  await fulfill({ route: pending!, status: 401, code: 'session_required' })
  await expect(page).toHaveURL(LOGIN)
  await expect(page.getByRole('list', { name: LIST })).toHaveCount(0)
})

test('chat list: recovery is readable and stable across themes and enlarged mobile text', async ({
  page,
}, testInfo) => {
  let calls = 0
  let pending: Route | undefined
  await page.route(API, (route) => {
    calls += 1
    if (calls === 1)
      return fulfill({ route, status: 503, code: 'service_unavailable' })
    pending = route
  })
  await signIn(page)
  const area = panel(page)
  const alert = area.getByRole('alert')
  const retry = area.getByRole('button')
  await expect(alert).toContainText(ERROR)
  for (const scale of [100, 200]) {
    const style = await page.addStyleTag({
      content: `html { font-size: ${scale}% }`,
    })
    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme })
      for (const width of [320, 1280]) {
        await page.setViewportSize({ width, height: 800 })
        await retry.scrollIntoViewIfNeeded()
        await expect(retry).toBeInViewport()
        await page.keyboard.press('Tab')
        await retry.focus()
        await expect(retry).toBeFocused()
        const buttonStyles = await readStyles(retry)
        expect(buttonStyles.outlineStyle).not.toBe('none')
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
        const cardColors = await readResolvedColors(alert.locator('..'))
        for (const paragraph of await alert.locator('p').all()) {
          const textColors = await readResolvedColors(paragraph)
          expect(
            textContrast({
              color: textColors.color,
              background: cardColors.background,
            }),
          ).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST)
        }
        const buttonBox = await retry.boundingBox()
        expect(buttonBox?.width).toBeGreaterThanOrEqual(44)
        expect(buttonBox?.height).toBeGreaterThanOrEqual(44)
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
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const cardBefore = await area.boundingBox()
  const buttonBefore = await retry.boundingBox()
  await retry.click()
  await expect(retry).toBeDisabled()
  await expect(retry).toHaveAccessibleName(RETRY_PENDING)
  expect(await area.boundingBox()).toEqual(cardBefore)
  expect(await retry.boundingBox()).toEqual(buttonBefore)
  expect(
    await retry
      .locator('svg')
      .evaluate((icon) => getComputedStyle(icon).animationName),
  ).toBe('none')
  await expect.poll(() => calls).toBe(2)
  await fulfill({ route: pending! })
  await expect(area.getByRole('alert')).toHaveCount(0)
})
