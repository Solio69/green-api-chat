import { expect, test } from './owner-fixture'
import { addChatSession } from '../chats/helpers'
import {
  MESSAGING_UI_TEST,
  NOTIFICATION_NOTICE_TEST,
} from '../notifications/ui-constants'
import sendScenarios from './fixtures/send-scenarios.json'
import { CONVERSATION_CONTRACT } from '../conversation.constants'
import {
  TEST_API_ROUTES,
  TEST_API_CODE,
  TEST_API_RESPONSE,
} from '../protocol.constants'
import {
  RECIPIENT_CONTRACT,
  RECIPIENT_SCENARIOS,
} from '../recipients.constants'
import { ROUTES, TEST_UI } from '../shared.constants'

const { PANE_LABEL } = CONVERSATION_CONTRACT
const { LABEL, SEND, SENDING } = MESSAGING_UI_TEST
const { RECONNECTING } = NOTIFICATION_NOTICE_TEST
const { PHONE_LABEL, SUBMIT, WRITE } = RECIPIENT_CONTRACT
const { MESSAGES, NOTIFICATIONS_RECEIVE } = TEST_API_ROUTES
const { RETRY_LATER } = TEST_API_CODE
const { OK, ERROR } = TEST_API_RESPONSE
const { HOME } = ROUTES
const { ROLE_BUTTON, ROLE_REGION, ROLE_TEXTBOX } = TEST_UI

const RECOVERY_TEST = {
  TEXT: 'Сообщение во время восстановления',
  VIEWPORT_WIDTHS: [360, 1280],
} as const

const { TEXT, VIEWPORT_WIDTHS } = RECOVERY_TEST

for (const width of VIEWPORT_WIDTHS) {
  test(`temporary receive failures do not interrupt sending or move the chat at ${width}px`, async ({
    page,
    context,
    baseURL,
  }) => {
    if (!baseURL) throw new Error('E2E baseURL is required')
    await page.setViewportSize({ width, height: 780 })
    const scenario = sendScenarios.success
    const connectionScope = await addChatSession({
      context,
      baseURL,
      credentials: {
        idInstance: scenario.id,
        apiTokenInstance: scenario.token,
      },
    })
    const receiveOutcomes = [ERROR, OK, ERROR, OK] as const
    const received = receiveOutcomes.map(() => Promise.withResolvers<void>())
    const release = receiveOutcomes.map(() => Promise.withResolvers<void>())
    const sendReceived = Promise.withResolvers<void>()
    const releaseSend = Promise.withResolvers<void>()
    const emptyReceive = {
      status: OK,
      connectionScope,
      delivery: null,
      ackToken: null,
    }
    let receiveCount = 0
    let sendCount = 0

    await page.route(NOTIFICATIONS_RECEIVE, async (route) => {
      const index = receiveCount
      receiveCount += 1
      if (index < received.length) {
        received[index].resolve()
        await release[index].promise
      }
      const temporaryFailure = receiveOutcomes[index] === ERROR
      if (temporaryFailure)
        await route.fulfill({
          status: 503,
          json: { status: ERROR, code: RETRY_LATER },
        })
      else await route.fulfill({ status: 200, json: emptyReceive })
    })
    await page.route(MESSAGES, async (route) => {
      sendCount += 1
      sendReceived.resolve()
      await releaseSend.promise
      await route.continue()
    })

    try {
      await page.goto(HOME)
      await received[0].promise
      await page
        .getByRole(ROLE_TEXTBOX, { name: PHONE_LABEL })
        .fill(RECIPIENT_SCENARIOS.foundPhone)
      await page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }).click()
      await page.getByRole(ROLE_BUTTON, { name: WRITE, exact: true }).click()

      const pane = page.getByRole(ROLE_REGION, { name: PANE_LABEL })
      const input = page.getByRole(ROLE_TEXTBOX, { name: LABEL, exact: true })
      const sendButton = page.getByRole(ROLE_BUTTON, {
        name: SEND,
        exact: true,
      })
      const recoveryNotice = page.getByText(RECONNECTING)
      await input.fill(TEXT)
      await expect(sendButton).toBeEnabled()
      const measureWorkspace = async () => {
        const paneBox = await pane.boundingBox()
        const inputBox = await input.boundingBox()
        const missingBounds = !paneBox || !inputBox
        if (missingBounds)
          throw new Error('Chat pane or composer is not visible')
        return {
          paneY: paneBox.y,
          paneHeight: paneBox.height,
          inputY: inputBox.y,
        }
      }
      const initialGeometry = await measureWorkspace()

      release[0].resolve()
      await received[1].promise
      await expect(sendButton).toBeEnabled()
      await expect(recoveryNotice).toHaveCount(0)
      expect(await measureWorkspace()).toEqual(initialGeometry)

      await sendButton.click()
      await sendReceived.promise
      await expect(pane.getByText(SENDING, { exact: true })).toBeVisible()
      await expect(sendButton).toBeDisabled()
      await expect(input).toHaveValue(TEXT)
      const pendingGeometry = await measureWorkspace()

      release[1].resolve()
      await received[2].promise
      await expect(pane.getByText(SENDING, { exact: true })).toBeVisible()
      expect(await measureWorkspace()).toEqual(pendingGeometry)

      release[2].resolve()
      await received[3].promise
      await expect(pane.getByText(SENDING, { exact: true })).toBeVisible()
      await expect(recoveryNotice).toHaveCount(0)
      expect(await measureWorkspace()).toEqual(pendingGeometry)

      releaseSend.resolve()
      await expect(input).toHaveValue('')
      await expect(pane.getByText(TEXT)).toBeVisible()
      expect(sendCount).toBe(1)
    } finally {
      release.forEach((item) => item.resolve())
      releaseSend.resolve()
    }
  })
}
