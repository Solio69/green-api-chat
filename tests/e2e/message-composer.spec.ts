import { expect, test } from './owner-fixture'
import { addChatSession } from '../chats/helpers'
import { MESSAGING_UI_TEST } from '../notifications/ui-constants'
import sendScenarios from './fixtures/send-scenarios.json'
import {
  RECIPIENT_CONTRACT,
  RECIPIENT_SCENARIOS,
  THEME_CONTRACT,
  THEME_BROWSER,
} from '../constants'
import { TEST_API_ROUTES } from '../protocol.constants'

const { MESSAGES: TEST_API_ROUTES_MESSAGES } = TEST_API_ROUTES

const { LIGHT, DARK } = THEME_CONTRACT
const { ERROR: LIGHT_ERROR } = LIGHT
const { ERROR: DARK_ERROR } = DARK
const { COLOR_SCHEME_LIGHT, COLOR_SCHEME_DARK } = THEME_BROWSER
const { PHONE_LABEL, SUBMIT, WRITE } = RECIPIENT_CONTRACT
const {
  LABEL,
  SEND,
  TEXT,
  ACCEPTED,
  READ,
  DELIVERED,
  SINGLE_LINE,
  VIEWPORT_WIDTHS,
  REPLY_TEXT,
  CONTROL_SIZE,
  OVERSIZED_TEXT,
  ENTER,
} = MESSAGING_UI_TEST
for (const width of VIEWPORT_WIDTHS) {
  test(`production send and incoming notification follow mockup at width ${width}`, async ({
    page,
    context,
    baseURL,
  }) => {
    await page.setViewportSize({ width, height: 780 })
    const scenario = sendScenarios.success
    await addChatSession({
      context,
      baseURL: baseURL!,
      credentials: {
        idInstance: scenario.id,
        apiTokenInstance: scenario.token,
      },
    })
    await page.goto('/')
    await page
      .getByRole('textbox', { name: PHONE_LABEL })
      .fill(RECIPIENT_SCENARIOS.foundPhone)
    await page.getByRole('button', { name: SUBMIT, exact: true }).click()
    await page.getByRole('button', { name: WRITE, exact: true }).click()
    const input = page.getByRole('textbox', { name: LABEL, exact: true })
    await page.emulateMedia({ colorScheme: COLOR_SCHEME_LIGHT })
    await input.fill(OVERSIZED_TEXT)
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(input).toHaveCSS('border-top-color', LIGHT_ERROR)
    await expect(
      page.getByRole('button', { name: SEND, exact: true }),
    ).toBeDisabled()
    await page.emulateMedia({ colorScheme: COLOR_SCHEME_DARK })
    await expect(input).toHaveCSS('border-top-color', DARK_ERROR)
    await input.fill(SINGLE_LINE)
    expect(
      await input.evaluate(
        (element) => element.scrollHeight > element.clientHeight,
      ),
    ).toBe(false)
    await expect(input).toHaveCSS('scrollbar-width', 'thin')
    await input.fill(TEXT)
    await expect(input).not.toHaveAttribute('aria-invalid', 'true')
    await expect(input).not.toHaveCSS('border-top-color', DARK_ERROR)
    await page.emulateMedia({ colorScheme: COLOR_SCHEME_LIGHT })
    await expect(
      page.getByRole('button', { name: SEND, exact: true }),
    ).toBeEnabled()
    const bounds = await input.boundingBox()
    expect(bounds?.height).toBe(CONTROL_SIZE)
    const button = await page
      .getByRole('button', { name: SEND, exact: true })
      .boundingBox()
    expect(button?.width).toBe(CONTROL_SIZE)
    expect(button?.height).toBe(CONTROL_SIZE)
    let resumeSend!: () => void
    let captureSend!: () => void
    const captured = new Promise<void>((resolve) => {
      captureSend = resolve
    })
    const released = new Promise<void>((resolve) => {
      resumeSend = resolve
    })
    await page.route(TEST_API_ROUTES_MESSAGES, async (route) => {
      captureSend()
      await released
      await route.continue()
    })
    const beforeSend = await input.evaluate((element) => ({
      fieldTop: element.getBoundingClientRect().top,
      composerHeight: element
        .closest('form')!
        .parentElement!.getBoundingClientRect().height,
    }))
    await input.press(ENTER)
    await captured
    await expect(input).not.toBeEditable()
    await expect(input).toBeFocused()
    const whileSending = await input.evaluate((element) => ({
      fieldTop: element.getBoundingClientRect().top,
      composerHeight: element
        .closest('form')!
        .parentElement!.getBoundingClientRect().height,
    }))
    resumeSend()
    expect(whileSending).toEqual(beforeSend)
    await expect(
      page.getByRole('img', { name: ACCEPTED, exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole('img', { name: DELIVERED, exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole('img', { name: READ, exact: true }),
    ).toBeVisible()
    await expect(page.getByText(REPLY_TEXT, { exact: true })).toBeVisible()
    await expect(input).toHaveValue('')
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true)
    await page.screenshot({
      path: test.info().outputPath(`messaging-${width}.png`),
    })
  })
}
