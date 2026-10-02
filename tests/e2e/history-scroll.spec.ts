import { expect, test } from './owner-fixture'
import { addChatSession } from '../chats/helpers'
import { MESSAGING_UI_TEST } from '../notifications/ui-constants'
import sendScenarios from './fixtures/send-scenarios.json'
import {
  RECIPIENT_CONTRACT,
  RECIPIENT_SCENARIOS,
  ROUTES,
  TEST_UI,
} from '../constants'
import {
  HISTORY_TEST,
  HISTORY_WINDOW_TEST,
  HISTORY_SCROLL_TEST,
} from '../history/constants'

const { PHONE_LABEL, SUBMIT, WRITE } = RECIPIENT_CONTRACT
const { HOME } = ROUTES
const { ROLE_BUTTON, ROLE_REGION, ROLE_LIST, ROLE_LIST_ITEM } = TEST_UI
const { API, SUCCESS, message } = HISTORY_TEST
const { WIDTHS, VIEWPORT_HEIGHT, LIST_LABEL, HISTORY_ITEMS } =
  HISTORY_WINDOW_TEST
const {
  COMPACT_VIEWPORT_HEIGHT,
  PANE_LABEL,
  ID_PREFIX,
  TEXT,
  BOTTOM_TOLERANCE,
  SCREENSHOT_PREFIX,
} = HISTORY_SCROLL_TEST
const { LABEL, SEND, SINGLE_LINE, REPLY_TEXT } = MESSAGING_UI_TEST

const viewports = WIDTHS.flatMap((width) =>
  [VIEWPORT_HEIGHT, COMPACT_VIEWPORT_HEIGHT].map((height) => ({
    width,
    height,
  })),
)

for (const { width, height } of viewports) {
  test(`history overflow: conversation keeps its height and follows incoming messages at width ${width} and height ${height}`, async ({
    page,
    context,
    baseURL,
  }) => {
    await page.setViewportSize({ width, height })
    const scenario = sendScenarios.success
    const scope = await addChatSession({
      context,
      baseURL: baseURL!,
      credentials: {
        idInstance: scenario.id,
        apiTokenInstance: scenario.token,
      },
    })
    let releaseHistory!: () => void
    const historyReady = new Promise<void>((resolve) => {
      releaseHistory = resolve
    })
    await page.route(API, async (route) => {
      await historyReady
      const { chatId } = route.request().postDataJSON()
      await route.fulfill({
        json: {
          status: SUCCESS,
          connectionScope: scope,
          chatId,
          messages: Array.from({ length: HISTORY_ITEMS }, (_, index) => ({
            ...message,
            chatId,
            idMessage: `${ID_PREFIX}${index}`,
            text: TEXT,
            timestamp: message.timestamp + index,
          })),
        },
      })
    })
    await page.goto(HOME)
    await page
      .getByRole('textbox', { name: PHONE_LABEL })
      .fill(RECIPIENT_SCENARIOS.foundPhone)
    await page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }).click()
    await page.getByRole(ROLE_BUTTON, { name: WRITE, exact: true }).click()
    const pane = page.getByRole(ROLE_REGION, { name: PANE_LABEL, exact: true })
    const input = page.getByRole('textbox', { name: LABEL, exact: true })
    const paneBefore = await pane.boundingBox()
    const inputBefore = await input.boundingBox()
    releaseHistory()
    const list = page.getByRole(ROLE_LIST, { name: LIST_LABEL, exact: true })
    await expect(list.getByRole(ROLE_LIST_ITEM)).toHaveCount(HISTORY_ITEMS)
    expect((await pane.boundingBox())?.height).toBe(paneBefore?.height)
    expect((await input.boundingBox())?.y).toBe(inputBefore?.y)
    const initial = await list.evaluate((element) => ({
      height: element.clientHeight,
      scrollHeight: element.scrollHeight,
      distance: element.scrollHeight - element.scrollTop - element.clientHeight,
      top: element.getBoundingClientRect().top,
      firstBottom: element.firstElementChild!.getBoundingClientRect().bottom,
    }))
    expect(initial.scrollHeight).toBeGreaterThan(initial.height)
    expect(initial.distance).toBeLessThanOrEqual(BOTTOM_TOLERANCE)
    expect(initial.firstBottom).toBeLessThan(initial.top)
    await input.fill(SINGLE_LINE)
    await page.getByRole(ROLE_BUTTON, { name: SEND, exact: true }).click()
    await expect(list.getByText(REPLY_TEXT, { exact: true })).toBeVisible()
    await expect
      .poll(() =>
        list.evaluate(
          (element) =>
            element.scrollHeight - element.scrollTop - element.clientHeight,
        ),
      )
      .toBeLessThanOrEqual(BOTTOM_TOLERANCE)
    expect((await pane.boundingBox())?.height).toBe(paneBefore?.height)
    expect((await input.boundingBox())?.y).toBe(inputBefore?.y)
    const final = await list.evaluate((element) => ({
      bottom: element.getBoundingClientRect().bottom,
      lastBottom: element.lastElementChild!.getBoundingClientRect().bottom,
    }))
    expect(final.lastBottom).toBeLessThanOrEqual(final.bottom)
    const inputAfter = await input.boundingBox()
    expect(inputAfter!.y + inputAfter!.height).toBeLessThanOrEqual(height)
    await list.evaluate((element) => {
      element.scrollTop = 0
    })
    await expect
      .poll(() => list.evaluate((element) => element.scrollTop))
      .toBe(0)
    const first = await list.getByRole(ROLE_LIST_ITEM).first().boundingBox()
    const listBounds = await list.boundingBox()
    expect(first!.y).toBeGreaterThanOrEqual(listBounds!.y)
    expect(first!.y).toBeLessThan(listBounds!.y + listBounds!.height)
    await list.evaluate((element) => {
      element.scrollTop = element.scrollHeight
    })
    await page.screenshot({
      path: test
        .info()
        .outputPath(`${SCREENSHOT_PREFIX}-${width}-${height}.png`),
    })
  })
}
