import { expect, test } from './owner-fixture'
import {
  CONVERSATION_CONTRACT,
  CONVERSATION_FIXTURES,
  CREDENTIALS,
  LOGIN_API_CONTRACT,
  MIN_TOUCH_TARGET_SIZE,
  RECIPIENT_API_CONTRACT,
  LOGIN_CONTRACT,
  RECIPIENT_CONTRACT,
  RECIPIENT_SCENARIOS,
  ROUTES,
  TEST_UI,
  THEME_BROWSER,
} from '../constants'

const { ID, TOKEN } = CREDENTIALS
const { ID_LABEL, TOKEN_LABEL, SUBMIT: LOGIN_SUBMIT } = LOGIN_CONTRACT
const {
  PHONE_LABEL,
  USERNAME_MODE,
  USERNAME_LABEL,
  SUBMIT,
  FOUND,
  PENDING,
  WRITE,
} = RECIPIENT_CONTRACT
const { foundPhone } = RECIPIENT_SCENARIOS
const { LOGIN, HOME, RECIPIENT_SEARCH_API } = ROUTES
const { CLOSE } = CONVERSATION_CONTRACT
const {
  phone,
  recipientChatId,
  searchWidths,
  viewportHeight,
  enlargedTextStyle,
  longLabel,
} = CONVERSATION_FIXTURES
const { OK_STATUS, RESPONSE_OK } = LOGIN_API_CONTRACT
const { RESULT_FOUND, MAX_LENGTH_USERNAME } = RECIPIENT_API_CONTRACT
const { ROLE_BUTTON, ROLE_STATUS, ROLE_HEADING, KEY_ENTER, EVENT_REQUEST } =
  TEST_UI
const { COLOR_SCHEME_LIGHT, COLOR_SCHEME_DARK, REDUCED_MOTION } = THEME_BROWSER

test('search UI: result label and functional write button preserve the request contract', async ({
  page,
}, testInfo) => {
  await page.goto(LOGIN)
  await page.getByLabel(ID_LABEL).fill(ID)
  await page.getByLabel(TOKEN_LABEL).fill(TOKEN)
  await page.getByRole(ROLE_BUTTON, { name: LOGIN_SUBMIT, exact: true }).click()
  await expect(page).toHaveURL(HOME)
  let requests = 0
  page.on(EVENT_REQUEST, (request) => {
    if (new URL(request.url()).pathname === RECIPIENT_SEARCH_API) requests += 1
  })
  let releaseSearch!: () => void
  const searchGate = new Promise<void>((resolve) => {
    releaseSearch = resolve
  })
  await page.route(RECIPIENT_SEARCH_API, async (route) => {
    await searchGate
    await route.continue()
  })
  await page.getByLabel(PHONE_LABEL).fill(foundPhone)
  await page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }).click()
  try {
    await expect(
      page.getByRole(ROLE_STATUS).filter({ hasText: PENDING }),
    ).toBeVisible()
    await expect(
      page.getByRole(ROLE_BUTTON, { name: PENDING, exact: true }),
    ).toBeDisabled()
  } finally {
    releaseSearch()
  }
  await expect(page.getByText(FOUND, { exact: true })).toBeVisible()
  await expect(page.getByText(foundPhone, { exact: true })).toBeVisible()
  const write = page.getByRole(ROLE_BUTTON, { name: WRITE, exact: true })
  await write.focus()
  await write.press(KEY_ENTER)
  await expect(page).toHaveURL(HOME)
  expect(requests).toBe(1)
  await expect(
    page.getByRole(ROLE_HEADING, { name: foundPhone, exact: true }),
  ).toBeVisible()
  await page.getByRole(ROLE_BUTTON, { name: CLOSE, exact: true }).click()
  for (const colorScheme of [COLOR_SCHEME_LIGHT, COLOR_SCHEME_DARK]) {
    await page.emulateMedia({ colorScheme, reducedMotion: REDUCED_MOTION })
    for (const width of searchWidths) {
      await page.setViewportSize({ width, height: viewportHeight })
      const box = await write.boundingBox()
      expect(box?.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true)
      await page.screenshot({
        path: testInfo.outputPath(`search-${colorScheme}-${width}.png`),
        fullPage: true,
      })
    }
  }
  await page.getByLabel(PHONE_LABEL).fill(phone)
  await expect(write).toHaveCount(0)
  await page.unroute(RECIPIENT_SEARCH_API)
  await page.route(RECIPIENT_SEARCH_API, (route) =>
    route.fulfill({
      status: OK_STATUS,
      json: {
        status: RESPONSE_OK,
        result: RESULT_FOUND,
        chatId: recipientChatId,
      },
    }),
  )
  await page
    .getByRole(ROLE_BUTTON, { name: USERNAME_MODE, exact: true })
    .click()
  const longUsername = MAX_LENGTH_USERNAME
  await page.getByLabel(USERNAME_LABEL, { exact: true }).fill(longUsername)
  await page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }).click()
  await expect(page.getByText(longLabel, { exact: true })).toBeVisible()
  await page.addStyleTag({ content: enlargedTextStyle })
  await page.setViewportSize({ width: 320, height: viewportHeight })
  await expect(write).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({
    path: testInfo.outputPath('search-long-text-200.png'),
    fullPage: true,
  })
})
