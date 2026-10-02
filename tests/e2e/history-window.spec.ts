import { expect, test } from './owner-fixture'
import { addChatSession } from '../chats/helpers'
import { TEST_UI, ROUTES } from '../constants'
import { HISTORY_TEST, HISTORY_WINDOW_TEST } from '../history/constants'

const { credentials, TARGET_A, message, API, SUCCESS, chatA } = HISTORY_TEST
const {
  WIDTHS,
  VIEWPORT_HEIGHT,
  UNSUPPORTED,
  LIST_LABEL,
  SCREENSHOT_NAME,
  LONG_TEXT,
  TIME_SELECTOR,
} = HISTORY_WINDOW_TEST
const { ROLE_BUTTON, ROLE_LIST, ROLE_LIST_ITEM } = TEST_UI
const { HOME } = ROUTES
for (const width of WIDTHS) {
  test(`history UI: real cookie and production conversation slot render mockup at width ${width}`, async ({
    page,
    context,
    baseURL,
  }) => {
    await page.setViewportSize({ width, height: VIEWPORT_HEIGHT })
    await addChatSession({ context, baseURL: baseURL!, credentials })
    await page.goto(HOME)
    await page
      .getByRole(ROLE_BUTTON, { name: TARGET_A.label, exact: true })
      .click()
    const list = page.getByRole(ROLE_LIST, { name: LIST_LABEL, exact: true })
    await expect(list.getByRole(ROLE_LIST_ITEM)).toHaveCount(2)
    await expect(page.getByText(message.text, { exact: true })).toBeVisible()
    await expect(page.getByText(UNSUPPORTED, { exact: true })).toBeVisible()
    const measurements = await list
      .getByRole(ROLE_LIST_ITEM)
      .evaluateAll((elements) =>
        elements.map((element) => {
          const bounds = element.getBoundingClientRect()
          return { left: bounds.left, right: bounds.right }
        }),
      )
    expect(measurements[0].left).toBeLessThan(measurements[1].left)
    const pageWidth = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(pageWidth.scrollWidth).toBeLessThanOrEqual(pageWidth.width)
    await page.screenshot({ path: test.info().outputPath(SCREENSHOT_NAME) })
  })
}

test('history UI: long unbroken text wraps inside mobile bubble without page overflow', async ({
  page,
  context,
  baseURL,
}) => {
  await page.setViewportSize({ width: WIDTHS[0], height: VIEWPORT_HEIGHT })
  const scope = await addChatSession({
    context,
    baseURL: baseURL!,
    credentials,
  })
  await page.route(API, (route) =>
    route.fulfill({
      json: {
        status: SUCCESS,
        connectionScope: scope,
        chatId: chatA,
        messages: [{ ...message, text: LONG_TEXT }],
      },
    }),
  )
  await page.goto(HOME)
  await page
    .getByRole(ROLE_BUTTON, { name: TARGET_A.label, exact: true })
    .click()
  const list = page.getByRole(ROLE_LIST, { name: LIST_LABEL, exact: true })
  await expect(list.getByText(LONG_TEXT, { exact: true })).toBeVisible()
  await expect(list.locator(TIME_SELECTOR)).toHaveCount(1)
  const viewport = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.width)
})
