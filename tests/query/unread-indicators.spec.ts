import { expect, test } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'
import { MESSAGING_UI_TEST } from '../notifications/ui-constants'
import { EMPTY_STRING, HTML_VALUES } from '@/lib/ui/constants'
import { THEME_BROWSER, TEST_UI } from '../constants'
import { HISTORY_TEST } from '../history/constants'
import {
  TEST_API_RESPONSE,
  TEST_API_ROUTES,
  TEST_MESSAGE_PROTOCOL,
} from '../protocol.constants'
import { UNREAD_TEST } from '../unread/constants'

const { ROLE_IMG } = HTML_VALUES
const { ROLE_BUTTON, ROLE_TEXTBOX, ROLE_HEADING, ATTR_ARIA_DESCRIBEDBY } =
  TEST_UI
const { scopeA, chatA, chatB, API } = HISTORY_TEST
const { CONTROL_API, LABEL, SEND } = MESSAGING_UI_TEST
const { CHATS } = TEST_API_ROUTES
const { OK } = TEST_API_RESPONSE
const { READ } = TEST_MESSAGE_PROTOCOL
const { COLOR_SCHEME_LIGHT, COLOR_SCHEME_DARK } = THEME_BROWSER
const {
  PATH,
  COUNT_LABEL,
  BACK,
  CLOSE,
  CHAT_A,
  CHAT_B,
  TEXT,
  UNKNOWN_CHAT,
  UNKNOWN_LABEL,
  VISIBLE,
  HIDDEN,
  VISIBILITY_EVENT,
  VISIBILITY_PROPERTY,
  ID_PREFIX,
  COUNTS,
  WIDTHS,
  HEIGHT,
  MOBILE_BREAKPOINT,
  PREVIEW_TIMEOUT_MS,
  PREVIEW_TEST_TIMEOUT_MS,
  LONG_LABEL,
  MAX_LABEL,
  OVER_LIMIT,
  ROW_MAX_HEIGHT,
  HEADER_NAME_MAX_HEIGHT,
  SCREENSHOT_PREFIX,
} = UNREAD_TEST

const inject = ({
  request,
  chatId = chatB,
  idMessage,
}: {
  request: APIRequestContext
  chatId?: string
  idMessage?: string
}) =>
  request.post(CONTROL_API, {
    data: { event: { chatId, text: TEXT, idMessage } },
  })
const snapshot = async (page: Page) =>
  JSON.parse(
    (await page.getByTestId(COUNTS).textContent()) ?? EMPTY_STRING,
  ) as { countsByChatId: Record<string, number>; total: number }
const setVisibility = ({ page, value }: { page: Page; value: string }) =>
  page.evaluate(
    ({ state, property, event }) => {
      Object.defineProperty(document, property, {
        configurable: true,
        get: () => state,
      })
      document.dispatchEvent(new Event(event))
    },
    { state: value, property: VISIBILITY_PROPERTY, event: VISIBILITY_EVENT },
  )
const waitForOwner = async (page: Page) => {
  const input = page.getByRole(ROLE_TEXTBOX, { name: LABEL, exact: true })
  await input.fill(TEXT)
  await expect(
    page.getByRole(ROLE_BUTTON, { name: SEND, exact: true }),
  ).toBeEnabled()
  await input.fill(EMPTY_STRING)
}

test.beforeEach(async ({ page, request }) => {
  await request.post(CONTROL_API, { data: { reset: true } })
  await page.route(CHATS, (route) =>
    route.fulfill({
      json: {
        status: OK,
        connectionScope: scopeA,
        chats: [
          { chatId: chatA, name: CHAT_A, username: null, phone: null },
          { chatId: chatB, name: CHAT_B, username: null, phone: null },
        ],
      },
    }),
  )
  await page.route(API, (route) =>
    route.fulfill({
      json: {
        status: OK,
        connectionScope: scopeA,
        chatId: route.request().postDataJSON().chatId,
        messages: [],
      },
    }),
  )
})

test('unread UI: another chat counts, duplicate delivery and ACK preserve one mark, opening clears it', async ({
  page,
  request,
}) => {
  await page.goto(PATH)
  await page.getByRole(ROLE_BUTTON, { name: CHAT_A, exact: true }).click()
  await waitForOwner(page)
  await inject({ request, idMessage: ID_PREFIX })
  const other = page.getByRole(ROLE_BUTTON, { name: CHAT_B, exact: true })
  await expect(other).toHaveAccessibleDescription(`${COUNT_LABEL} 1`)
  await inject({ request, idMessage: ID_PREFIX })
  await expect
    .poll(
      async () =>
        (await (await request.get(CONTROL_API)).json()).deletes.length,
    )
    .toBe(2)
  await expect(other).toHaveAccessibleDescription(`${COUNT_LABEL} 1`)
  await other.click()
  await expect(other).not.toHaveAttribute(ATTR_ARIA_DESCRIBEDBY)
  await page.getByRole(ROLE_BUTTON, { name: CHAT_A, exact: true }).click()
  await inject({ request, idMessage: ID_PREFIX })
  await expect
    .poll(
      async () =>
        (await (await request.get(CONTROL_API)).json()).deletes.length,
    )
    .toBe(3)
  await expect.poll(async () => (await snapshot(page)).total).toBe(0)
})

test('unread UI: hidden selected chat counts and return clears only it; visible incoming/status do not count', async ({
  page,
  request,
}) => {
  await page.goto(PATH)
  await page.getByRole(ROLE_BUTTON, { name: CHAT_A, exact: true }).click()
  await waitForOwner(page)
  await inject({ request, chatId: chatA })
  await expect
    .poll(
      async () =>
        (await (await request.get(CONTROL_API)).json()).deletes.length,
    )
    .toBe(1)
  expect((await snapshot(page)).total).toBe(0)
  await setVisibility({ page, value: HIDDEN })
  await inject({ request, chatId: chatA })
  await inject({ request })
  await expect.poll(async () => (await snapshot(page)).total).toBe(2)
  await setVisibility({ page, value: VISIBLE })
  await expect
    .poll(async () => (await snapshot(page)).countsByChatId[chatA] ?? 0)
    .toBe(0)
  expect((await snapshot(page)).countsByChatId[chatB]).toBe(1)
  await request.post(CONTROL_API, { data: { event: { status: READ } } })
  await expect
    .poll(
      async () =>
        (await (await request.get(CONTROL_API)).json()).deletes.length,
    )
    .toBe(4)
  expect((await snapshot(page)).total).toBe(1)
})

test('unread UI: unknown chat appears with mark and list refresh does not erase it', async ({
  page,
  request,
}) => {
  await page.goto(PATH)
  await page.getByRole(ROLE_BUTTON, { name: CHAT_A, exact: true }).click()
  await waitForOwner(page)
  await inject({ request, chatId: UNKNOWN_CHAT })
  const unknown = page.getByRole(ROLE_BUTTON, {
    name: UNKNOWN_LABEL,
    exact: true,
  })
  await expect(unknown).toHaveAccessibleDescription(`${COUNT_LABEL} 1`)
  await inject({ request })
  await expect.poll(async () => (await snapshot(page)).total).toBe(2)
  await expect(unknown).toHaveAccessibleDescription(`${COUNT_LABEL} 1`)
  await page.reload()
  await expect.poll(async () => (await snapshot(page)).total).toBe(0)
})

test('unread UI: mobile hidden conversation counts, back button totals and resize reveals/clears selected chat', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: HEIGHT })
  await page.goto(PATH)
  await page.getByRole(ROLE_BUTTON, { name: CHAT_A, exact: true }).click()
  await waitForOwner(page)
  await inject({ request })
  const back = page.getByRole(ROLE_BUTTON, { name: BACK, exact: true })
  await expect(back).toHaveAccessibleDescription(`${COUNT_LABEL} 1`)
  await back.click()
  await inject({ request, chatId: chatA })
  await expect(
    page.getByRole(ROLE_BUTTON, { name: CHAT_A, exact: true }),
  ).toHaveAccessibleDescription(`${COUNT_LABEL} 1`)
  await page.setViewportSize({ width: 1280, height: HEIGHT })
  await expect.poll(async () => (await snapshot(page)).total).toBe(1)
  await page.setViewportSize({ width: 390, height: HEIGHT })
  await page.getByRole(ROLE_BUTTON, { name: CHAT_B, exact: true }).click()
  await expect(back).not.toHaveAttribute(ATTR_ARIA_DESCRIBEDBY)
})

for (const width of WIDTHS) {
  for (const colorScheme of [COLOR_SCHEME_LIGHT, COLOR_SCHEME_DARK]) {
    test(`unread preview: ${width}px ${colorScheme} count/99+ layout and mobile navigation`, async ({
      page,
      request,
    }, testInfo) => {
      test.setTimeout(PREVIEW_TEST_TIMEOUT_MS)
      await page.setViewportSize({ width, height: HEIGHT })
      await page.emulateMedia({ colorScheme })
      await page.route(CHATS, (route) =>
        route.fulfill({
          json: {
            status: OK,
            connectionScope: scopeA,
            chats: [
              { chatId: chatA, name: CHAT_A, username: null, phone: null },
              { chatId: chatB, name: CHAT_B, username: null, phone: null },
            ],
          },
        }),
      )
      await page.goto(PATH)
      await page.getByRole(ROLE_BUTTON, { name: CHAT_A, exact: true }).click()
      await waitForOwner(page)
      for (let index = 0; index < OVER_LIMIT; index += 1)
        await inject({ request, idMessage: `${ID_PREFIX}${index}` })
      await expect
        .poll(async () => (await snapshot(page)).total, {
          timeout: PREVIEW_TIMEOUT_MS,
        })
        .toBe(OVER_LIMIT)
      const mobile = width < MOBILE_BREAKPOINT
      if (mobile) {
        const back = page.getByRole(ROLE_BUTTON, { name: BACK, exact: true })
        await expect(back).toHaveAccessibleDescription(
          `${COUNT_LABEL} ${OVER_LIMIT}`,
        )
        await expect(back.getByRole(ROLE_IMG)).toHaveText(MAX_LABEL)
        const close = page.getByRole(ROLE_BUTTON, { name: CLOSE, exact: true })
        const backBounds = (await back.boundingBox())!
        const closeBounds = (await close.boundingBox())!
        const heading = page.getByRole(ROLE_HEADING, {
          name: CHAT_A,
          exact: true,
        })
        expect((await heading.boundingBox())!.height).toBeLessThanOrEqual(
          HEADER_NAME_MAX_HEIGHT,
        )
        expect(closeBounds.y + closeBounds.height / 2).toBeLessThan(
          backBounds.y + backBounds.height,
        )
        expect(
          await page.evaluate(
            () =>
              document.documentElement.scrollWidth <=
              document.documentElement.clientWidth,
          ),
        ).toBe(true)
        await page.screenshot({
          path: testInfo.outputPath(`${SCREENSHOT_PREFIX}-conversation.png`),
        })
        await back.click()
      }
      const row = page.getByRole(ROLE_BUTTON, { name: CHAT_B, exact: true })
      await expect(row).toHaveAccessibleDescription(
        `${COUNT_LABEL} ${OVER_LIMIT}`,
      )
      await expect(row.getByRole(ROLE_IMG)).toHaveText(MAX_LABEL)
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth,
        ),
      ).toBe(true)
      await page.screenshot({
        path: testInfo.outputPath(`${SCREENSHOT_PREFIX}-list.png`),
      })
      await row.click()
      await expect.poll(async () => (await snapshot(page)).total).toBe(0)
    })
  }
}

test('unread UI: long chat label truncates without moving the badge outside its row', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 320, height: HEIGHT })
  await page.route(CHATS, (route) =>
    route.fulfill({
      json: {
        status: OK,
        connectionScope: scopeA,
        chats: [
          { chatId: chatA, name: CHAT_A, username: null, phone: null },
          { chatId: chatB, name: LONG_LABEL, username: null, phone: null },
        ],
      },
    }),
  )
  await page.goto(PATH)
  await page.getByRole(ROLE_BUTTON, { name: CHAT_A, exact: true }).click()
  await waitForOwner(page)
  await inject({ request })
  const back = page.getByRole(ROLE_BUTTON, { name: BACK, exact: true })
  await expect(back).toHaveAccessibleDescription(`${COUNT_LABEL} 1`)
  await back.click()
  const row = page.getByRole(ROLE_BUTTON, { name: LONG_LABEL, exact: true })
  const badge = row.getByRole(ROLE_IMG)
  await expect(badge).toBeVisible()
  const rowBounds = (await row.boundingBox())!
  const badgeBounds = (await badge.boundingBox())!
  expect(badgeBounds.x + badgeBounds.width).toBeLessThanOrEqual(
    rowBounds.x + rowBounds.width,
  )
  expect(rowBounds.height).toBeLessThan(ROW_MAX_HEIGHT)
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)
})
