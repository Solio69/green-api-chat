import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import {
  CONVERSATION_CONTRACT,
  CONVERSATION_FIXTURES,
  CREDENTIALS,
  LOGIN_API_CONTRACT,
  LOGIN_CONTRACT,
  RECIPIENT_API_CONTRACT,
  RECIPIENT_CONTRACT,
  ROUTES,
  ROUTE_PATTERNS,
  TEST_UI,
  THEME_BROWSER,
  WORKSPACE_FOCUS_FIXTURES,
} from '../constants'
import { HISTORY_TEST } from '../history/constants'
import { CHAT_LIST_UI } from './chat-list-ui.constants'

const { ID, TOKEN } = CREDENTIALS
const { ID_LABEL, TOKEN_LABEL, SUBMIT: LOGIN_SUBMIT } = LOGIN_CONTRACT
const { LOGIN, HOME } = ROUTES
const {
  targetA,
  targetB,
  newChatId,
  phone,
  longChatId,
  longLabel,
  widths,
  mobileViewport,
  desktopViewport,
  viewportHeight,
  longLabelViewportHeight,
  enlargedTextStyle,
  longLabelWidths,
} = CONVERSATION_FIXTURES
const {
  BACK,
  CLOSE,
  EMPTY_HEADING,
  PREMATURE_EMPTY_HISTORY,
  UNIMPLEMENTED_API_PATTERN,
} = CONVERSATION_CONTRACT
const { PHONE_LABEL, USERNAME_MODE, USERNAME_LABEL, SUBMIT, WRITE } =
  RECIPIENT_CONTRACT
const { RESULT_FOUND } = RECIPIENT_API_CONTRACT
const { RESPONSE_OK } = LOGIN_API_CONTRACT
const { RECIPIENT_SEARCH_API } = ROUTE_PATTERNS
const { API: CHATS_API, SCOPE_HEADER, LIST } = CHAT_LIST_UI
const {
  ROLE_BUTTON,
  ROLE_HEADING,
  ROLE_LIST,
  ROLE_LIST_ITEM,
  ATTR_ARIA_PRESSED,
  BOOLEAN_TRUE,
  BOOLEAN_FALSE,
  KEY_ENTER,
  KEY_TAB,
  EVENT_REQUEST,
} = TEST_UI
const { COLOR_SCHEME_LIGHT, COLOR_SCHEME_DARK } = THEME_BROWSER
const { API: HISTORY_API, SUCCESS: HISTORY_SUCCESS } = HISTORY_TEST
const { OUTSIDE_CONTROL_ID, OUTSIDE_CONTROL_LABEL } = WORKSPACE_FOCUS_FIXTURES

const chats = [targetA, targetB].map(({ chatId, label }) => ({
  chatId,
  name: label,
  username: null,
  phone: null,
}))
const prepare = async (page: Page) => {
  await page.route(`**${HISTORY_API}`, (route) =>
    route.fulfill({
      json: {
        status: HISTORY_SUCCESS,
        connectionScope: route.request().headers()[SCOPE_HEADER],
        chatId: route.request().postDataJSON().chatId,
        messages: [],
      },
    }),
  )
  await page.route(CHATS_API, (route) =>
    route.fulfill({
      json: {
        status: RESPONSE_OK,
        connectionScope: route.request().headers()[SCOPE_HEADER],
        chats,
      },
    }),
  )
  await page.goto(LOGIN)
  await page.getByLabel(ID_LABEL).fill(ID)
  await page.getByLabel(TOKEN_LABEL).fill(TOKEN)
  await page.getByRole(ROLE_BUTTON, { name: LOGIN_SUBMIT, exact: true }).click()
  await expect(page).toHaveURL(HOME)
  await expect(page.getByRole(ROLE_LIST, { name: LIST })).toBeVisible()
}

test('conversation: keyboard selects actual recipients, close preserves list and cookie', async ({
  page,
}) => {
  await prepare(page)
  const cookies = await page.context().cookies()
  const a = page.getByRole(ROLE_BUTTON, { name: targetA.label, exact: true })
  await a.focus()
  await a.press(KEY_ENTER)
  await expect(
    page.getByRole(ROLE_HEADING, { name: targetA.label, exact: true }),
  ).toBeVisible()
  await expect(a).toHaveAttribute(ATTR_ARIA_PRESSED, BOOLEAN_TRUE)
  await page
    .getByRole(ROLE_BUTTON, { name: targetB.label, exact: true })
    .click()
  await expect(
    page.getByRole(ROLE_HEADING, { name: targetB.label, exact: true }),
  ).toBeVisible()
  await expect(a).toHaveAttribute(ATTR_ARIA_PRESSED, BOOLEAN_FALSE)
  await page.getByRole(ROLE_BUTTON, { name: CLOSE, exact: true }).click()
  await expect(
    page.getByRole(ROLE_HEADING, { name: EMPTY_HEADING }),
  ).toBeVisible()
  await expect(a).toBeFocused()
  await expect(page.getByRole(ROLE_LIST_ITEM)).toHaveCount(chats.length)
  expect(await page.context().cookies()).toEqual(cookies)
})

test('conversation: mobile back, tab order and resize preserve selection', async ({
  page,
}, testInfo) => {
  await page.setViewportSize(mobileViewport)
  await prepare(page)
  const a = page.getByRole(ROLE_BUTTON, { name: targetA.label, exact: true })
  await a.click()
  const heading = page.getByRole(ROLE_HEADING, {
    name: targetA.label,
    exact: true,
  })
  await expect(heading).toBeFocused()
  await expect(page.getByLabel(PHONE_LABEL)).toBeHidden()
  await page.keyboard.press(KEY_TAB)
  await expect(
    page.getByRole(ROLE_BUTTON, { name: CLOSE, exact: true }),
  ).toBeFocused()
  await page.getByRole(ROLE_BUTTON, { name: BACK, exact: true }).click()
  await expect(a).toBeFocused()
  await expect(heading).toBeHidden()
  await expect(a).toHaveAttribute(ATTR_ARIA_PRESSED, BOOLEAN_TRUE)
  await page.setViewportSize(desktopViewport)
  await expect(heading).toBeVisible()
  await page.getByRole(ROLE_BUTTON, { name: CLOSE }).focus()
  await page.setViewportSize(mobileViewport)
  await expect(a).toBeFocused()
  await a.click()
  for (const width of widths) {
    await page.setViewportSize({ width, height: viewportHeight })
    await expect(heading).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
    await page.screenshot({
      path: testInfo.outputPath(`conversation-${width}.png`),
      fullPage: true,
    })
  }
  await page.getByRole(ROLE_BUTTON, { name: CLOSE }).click()
  await expect(page.getByLabel(PHONE_LABEL)).toBeVisible()
})

test('conversation: found target opens with one history request, no Send or another lookup', async ({
  page,
}) => {
  let calls = 0
  let historyCalls = 0
  const prohibited: string[] = []
  page.on(EVENT_REQUEST, (request) => {
    if (new URL(request.url()).pathname === HISTORY_API) historyCalls += 1
    if (UNIMPLEMENTED_API_PATTERN.test(request.url()))
      prohibited.push(request.url())
  })
  await page.route(RECIPIENT_SEARCH_API, (route) => {
    calls += 1
    return route.fulfill({
      json: { status: RESPONSE_OK, result: RESULT_FOUND, chatId: newChatId },
    })
  })
  await prepare(page)
  await page.getByLabel(PHONE_LABEL).fill(phone)
  await page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }).click()
  await page.getByRole(ROLE_BUTTON, { name: WRITE, exact: true }).click()
  await expect(
    page.getByRole(ROLE_HEADING, { name: phone, exact: true }),
  ).toBeVisible()
  await expect(page.getByRole(ROLE_LIST_ITEM)).toHaveCount(chats.length)
  await expect(
    page.getByText(PREMATURE_EMPTY_HISTORY, { exact: true }),
  ).toHaveCount(0)
  expect(calls).toBe(1)
  await expect.poll(() => historyCalls).toBe(1)
  expect(prohibited).toEqual([])
})

test('conversation: long actual label fits themes and enlarged mobile text', async ({
  page,
}, testInfo) => {
  await page.route(RECIPIENT_SEARCH_API, (route) =>
    route.fulfill({
      json: { status: RESPONSE_OK, result: RESULT_FOUND, chatId: longChatId },
    }),
  )
  await prepare(page)
  await page
    .getByRole(ROLE_BUTTON, { name: USERNAME_MODE, exact: true })
    .click()
  await page.getByLabel(USERNAME_LABEL, { exact: true }).fill(longLabel)
  await page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }).click()
  await page.getByRole(ROLE_BUTTON, { name: WRITE, exact: true }).click()
  await page.addStyleTag({ content: enlargedTextStyle })
  for (const colorScheme of [COLOR_SCHEME_LIGHT, COLOR_SCHEME_DARK]) {
    await page.emulateMedia({ colorScheme })
    for (const width of longLabelWidths) {
      await page.setViewportSize({ width, height: longLabelViewportHeight })
      await expect(
        page.getByRole(ROLE_HEADING, { name: longLabel, exact: true }),
      ).toBeVisible()
      await expect(
        page.getByRole(ROLE_BUTTON, { name: CLOSE, exact: true }),
      ).toBeVisible()
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true)
      await page.screenshot({
        path: testInfo.outputPath(
          `conversation-long-${colorScheme}-${width}.png`,
        ),
        fullPage: true,
      })
    }
  }
})

test('conversation focus: hiding the focused search moves focus to the selected conversation', async ({
  page,
}) => {
  await page.setViewportSize(desktopViewport)
  await prepare(page)
  await page
    .getByRole(ROLE_BUTTON, { name: targetA.label, exact: true })
    .click()
  const input = page.getByLabel(PHONE_LABEL)
  await input.focus()
  await expect(input).toBeFocused()
  await page.setViewportSize(mobileViewport)
  await expect(input).toBeHidden()
  await expect(
    page.getByRole(ROLE_HEADING, { name: targetA.label, exact: true }),
  ).toBeFocused()
})

test('conversation focus: resize does not steal focus from an outside control', async ({
  page,
}) => {
  await page.setViewportSize(desktopViewport)
  await prepare(page)
  const selected = page.getByRole(ROLE_BUTTON, {
    name: targetA.label,
    exact: true,
  })
  await selected.click()
  await page.locator('body').evaluate(
    (body, { id, label }) => {
      const button = body.ownerDocument.createElement('button')
      button.id = id
      button.textContent = label
      body.append(button)
    },
    { id: OUTSIDE_CONTROL_ID, label: OUTSIDE_CONTROL_LABEL },
  )
  const outside = page.getByRole(ROLE_BUTTON, {
    name: OUTSIDE_CONTROL_LABEL,
    exact: true,
  })
  await page.getByLabel(PHONE_LABEL).focus()
  await outside.focus()
  await page.setViewportSize(mobileViewport)
  await expect(outside).toBeFocused()
  await page.getByRole(ROLE_BUTTON, { name: BACK, exact: true }).click()
  await page.setViewportSize(desktopViewport)
  await page.getByRole(ROLE_BUTTON, { name: CLOSE, exact: true }).focus()
  await outside.focus()
  await page.setViewportSize(mobileViewport)
  await expect(outside).toBeFocused()
})
