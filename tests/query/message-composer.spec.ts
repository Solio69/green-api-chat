import { expect, test } from './owner-fixture'
import { MESSAGING_UI_TEST } from '../notifications/ui-constants'
import { HISTORY_TEST } from '../history/constants'
import {
  TEST_API_RESPONSE,
  TEST_MESSAGE_PROTOCOL,
  TEST_API_ROUTES,
} from '../protocol.constants'

const { CHATS: TEST_API_ROUTES_CHATS } = TEST_API_ROUTES

const { OK: TEST_API_RESPONSE_OK } = TEST_API_RESPONSE
const {
  DELIVERED: TEST_MESSAGE_PROTOCOL_DELIVERED,
  READ: TEST_MESSAGE_PROTOCOL_READ,
  NO_ACCOUNT: TEST_MESSAGE_PROTOCOL_NO_ACCOUNT,
  FAILED: TEST_MESSAGE_PROTOCOL_FAILED,
  INCOMING: TEST_MESSAGE_PROTOCOL_INCOMING,
  TEXT: TEST_MESSAGE_PROTOCOL_TEXT,
  OUTGOING: TEST_MESSAGE_PROTOCOL_OUTGOING,
} = TEST_MESSAGE_PROTOCOL

const { scopeA, API, chatA } = HISTORY_TEST
const {
  PATH,
  CONTROL_API,
  LABEL,
  SEND,
  OPEN_A,
  OPEN_B,
  TEXT,
  ACCEPTED,
  READ,
  DELIVERED,
  FAILED,
  FAILURE,
  LIMIT,
  DRAFT,
  OVERSIZED_TEXT,
  ENTER,
} = MESSAGING_UI_TEST
test.beforeEach(async ({ page }) => {
  await page.route(API, (route) =>
    route.fulfill({
      json: {
        status: TEST_API_RESPONSE_OK,
        connectionScope: scopeA,
        chatId: route.request().postDataJSON().chatId,
        messages: [],
      },
    }),
  )
  await page.route(TEST_API_ROUTES_CHATS, (route) =>
    route.fulfill({
      json: {
        status: TEST_API_RESPONSE_OK,
        connectionScope: scopeA,
        chats: [],
      },
    }),
  )
})
test('composer submits original text and shows API acceptance before confirmed read', async ({
  page,
  request,
}) => {
  await page.goto(PATH)
  await page.getByRole('button', { name: OPEN_A }).click()
  const input = page.getByRole('textbox', { name: LABEL, exact: true })
  await input.fill(TEXT)
  await expect(page.getByRole('button', { name: SEND })).toBeEnabled()
  await input.press(ENTER)
  await expect(
    page.getByRole('img', { name: ACCEPTED, exact: true }),
  ).toBeVisible()
  expect((await (await request.get(CONTROL_API)).json()).sends).toEqual([
    { chatId: chatA, message: TEXT },
  ])
  await expect(input).toHaveValue('')
  await request.post(CONTROL_API, {
    data: { event: { status: TEST_MESSAGE_PROTOCOL_DELIVERED } },
  })
  await expect(
    page.getByRole('img', { name: DELIVERED, exact: true }),
  ).toBeVisible()
  await request.post(CONTROL_API, {
    data: { event: { status: TEST_MESSAGE_PROTOCOL_READ } },
  })
  await expect(page.getByRole('img', { name: READ, exact: true })).toBeVisible()
  await request.post(CONTROL_API, {
    data: {
      event: { status: TEST_MESSAGE_PROTOCOL_NO_ACCOUNT, idMessage: null },
    },
  })
  await expect(page.getByText(FAILURE, { exact: true })).toBeVisible()
  await expect(page.getByRole('img', { name: READ, exact: true })).toBeVisible()
  await input.fill(TEXT)
  await input.press(ENTER)
  await expect(
    page.getByRole('img', { name: ACCEPTED, exact: true }),
  ).toBeVisible()
  await request.post(CONTROL_API, {
    data: { event: { status: TEST_MESSAGE_PROTOCOL_FAILED } },
  })
  await expect(
    page.getByRole('img', { name: FAILED, exact: true }),
  ).toBeVisible()
  await input.fill(TEXT)
  await input.press(ENTER)
  await expect(
    page.getByRole('img', { name: ACCEPTED, exact: true }),
  ).toBeVisible()
  await request.post(CONTROL_API, {
    data: { event: { status: TEST_MESSAGE_PROTOCOL_NO_ACCOUNT } },
  })
  await expect(
    page.getByRole('img', { name: FAILURE, exact: true }),
  ).toBeVisible()
})
test('pending send survives switching chats and never clears the new editor', async ({
  page,
  request,
}) => {
  await request.post(CONTROL_API, { data: { sendDelay: 1_000 } })
  await page.goto(PATH)
  await page.getByRole('button', { name: OPEN_A }).click()
  const input = page.getByRole('textbox', { name: LABEL, exact: true })
  await input.fill(TEXT)
  await expect(page.getByRole('button', { name: SEND })).toBeEnabled()
  await page.getByRole('button', { name: SEND }).click()
  await page.getByRole('button', { name: OPEN_B }).click()
  await input.fill(DRAFT)
  await expect(page.getByRole('button', { name: SEND })).toBeDisabled()
  await expect(page.getByRole('button', { name: SEND })).toBeEnabled()
  await expect(input).toHaveValue(DRAFT)
  await expect(
    page.getByRole('img', { name: ACCEPTED, exact: true }),
  ).toHaveCount(0)
  await page.getByRole('button', { name: OPEN_A }).click()
  await expect(
    page.getByRole('img', { name: ACCEPTED, exact: true }),
  ).toBeVisible()
})
test('a second tab is limited and cannot send', async ({ page, context }) => {
  await page.goto(PATH)
  await page.getByRole('button', { name: OPEN_A }).click()
  await page.getByRole('textbox', { name: LABEL, exact: true }).fill(TEXT)
  await expect(page.getByRole('button', { name: SEND })).toBeEnabled()
  const second = await context.newPage()
  await second.goto(PATH)
  await expect(second.getByText(LIMIT, { exact: true })).toBeVisible()
  await second.close()
})

const ERROR_UI_TEST = {
  CHECK_HISTORY: 'Проверить историю',
  REPEAT: 'Повторить отправку',
  WARNING:
    'Повторная отправка может создать дубликат. История не доказывает исход первой попытки.',
  MULTILINE: 'Первая строка\nВторая строка',
  SPACE_TEXT: '   \n  ',
} as const
const { CHECK_HISTORY, REPEAT, WARNING, MULTILINE, SPACE_TEXT } = ERROR_UI_TEST

test('lost response preserves input, requires a history check and leaves retry to the user', async ({
  page,
  request,
}) => {
  await request.post(CONTROL_API, { data: { unknown: true } })
  await page.goto(PATH)
  await page.getByRole('button', { name: OPEN_A }).click()
  const input = page.getByRole('textbox', { name: LABEL, exact: true })
  await input.fill(TEXT)
  await expect(page.getByRole('button', { name: SEND })).toBeEnabled()
  await input.press(ENTER)
  await expect(page.getByRole('button', { name: CHECK_HISTORY })).toBeVisible()
  await expect(input).toHaveValue(TEXT)
  await expect(page.getByText(WARNING, { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: SEND })).toBeDisabled()
  await expect(
    page.getByRole('img', { name: ACCEPTED, exact: true }),
  ).toHaveCount(0)
  expect((await (await request.get(CONTROL_API)).json()).sends).toHaveLength(1)
  await page.getByRole('button', { name: CHECK_HISTORY }).click()
  await expect(page.getByRole('button', { name: REPEAT })).toBeEnabled()
  await request.post(CONTROL_API, { data: { unknown: false } })
  await page.getByRole('button', { name: REPEAT }).click()
  await expect(
    page.getByRole('img', { name: ACCEPTED, exact: true }),
  ).toBeVisible()
  expect((await (await request.get(CONTROL_API)).json()).sends).toHaveLength(2)
})

test('IME Enter and Shift+Enter never submit, blank and over-limit input are rejected locally', async ({
  page,
  request,
}) => {
  await page.goto(PATH)
  await page.getByRole('button', { name: OPEN_A }).click()
  const input = page.getByRole('textbox', { name: LABEL, exact: true })
  const button = page.getByRole('button', { name: SEND })
  await input.fill(SPACE_TEXT)
  await expect(button).toBeDisabled()
  await input.fill(OVERSIZED_TEXT)
  await expect(button).toBeDisabled()
  await expect(input).toHaveAttribute('aria-invalid', 'true')
  await input.fill(TEXT)
  await expect(button).toBeEnabled()
  await expect(input).not.toHaveAttribute('aria-invalid', 'true')
  await input.dispatchEvent('compositionstart')
  await input.press(ENTER)
  await input.dispatchEvent('compositionend')
  expect((await (await request.get(CONTROL_API)).json()).sends).toHaveLength(0)
  await input.press('Shift+Enter')
  expect((await (await request.get(CONTROL_API)).json()).sends).toHaveLength(0)
  await input.fill(MULTILINE)
  await input.press(ENTER)
  await expect(
    page.getByRole('img', { name: ACCEPTED, exact: true }),
  ).toBeVisible()
  expect((await (await request.get(CONTROL_API)).json()).sends).toEqual([
    { chatId: chatA, message: MULTILINE },
  ])
})

const LIVE_HISTORY_TEST = {
  INCOMING_ID: 'fixture-incoming-1',
  SEND_ID: 'fixture-send-1',
  LIVE_TEXT: 'Новое сообщение во время загрузки истории',
  OLD_TEXT: 'Старый снимок этого же сообщения',
  TIMESTAMP: 1_800_000_000,
} as const
const { INCOMING_ID, SEND_ID, LIVE_TEXT, OLD_TEXT, TIMESTAMP } =
  LIVE_HISTORY_TEST

test('incoming is applied and ACKed before late history, which preserves live content without duplicates', async ({
  page,
  request,
}) => {
  let finishHistory!: () => Promise<void>
  await page.route(
    API,
    (route) =>
      new Promise<void>((resolve) => {
        finishHistory = async () => {
          await route.fulfill({
            json: {
              status: TEST_API_RESPONSE_OK,
              connectionScope: scopeA,
              chatId: chatA,
              messages: [
                {
                  chatId: chatA,
                  idMessage: INCOMING_ID,
                  direction: TEST_MESSAGE_PROTOCOL_INCOMING,
                  kind: TEST_MESSAGE_PROTOCOL_TEXT,
                  text: OLD_TEXT,
                  timestamp: TIMESTAMP,
                  acceptedAt: null,
                  status: null,
                },
              ],
            },
          })
          resolve()
        }
      }),
  )
  await page.goto(PATH)
  await page.getByRole('button', { name: OPEN_A }).click()
  await page.getByRole('textbox', { name: LABEL, exact: true }).fill(TEXT)
  await expect(page.getByRole('button', { name: SEND })).toBeEnabled()
  await request.post(CONTROL_API, {
    data: { event: { text: LIVE_TEXT } },
  })
  await expect(page.getByText(LIVE_TEXT, { exact: true })).toBeVisible()
  await expect
    .poll(
      async () =>
        (await (await request.get(CONTROL_API)).json()).deletes.length,
    )
    .toBe(1)
  await finishHistory()
  await expect(page.getByText(LIVE_TEXT, { exact: true })).toHaveCount(1)
  await expect(page.getByText(OLD_TEXT, { exact: true })).toHaveCount(0)
})

test('read notification before HTTP acceptance creates no empty bubble and attaches to the accepted message', async ({
  page,
  request,
}) => {
  await request.post(CONTROL_API, { data: { sendDelay: 1500 } })
  await page.goto(PATH)
  await page.getByRole('button', { name: OPEN_A }).click()
  const input = page.getByRole('textbox', { name: LABEL, exact: true })
  await input.fill(TEXT)
  await expect(page.getByRole('button', { name: SEND })).toBeEnabled()
  await page.getByRole('button', { name: SEND }).click()
  await expect
    .poll(
      async () => (await (await request.get(CONTROL_API)).json()).sends.length,
    )
    .toBe(1)
  await request.post(CONTROL_API, {
    data: { event: { status: TEST_MESSAGE_PROTOCOL_READ, idMessage: SEND_ID } },
  })
  await expect
    .poll(
      async () =>
        (await (await request.get(CONTROL_API)).json()).deletes.length,
    )
    .toBe(1)
  await expect(page.getByRole('img', { name: READ, exact: true })).toHaveCount(
    0,
  )
  await expect(page.getByRole('img', { name: READ, exact: true })).toBeVisible()
  await expect(
    page.getByRole('img', { name: ACCEPTED, exact: true }),
  ).toHaveCount(0)
  await expect(input).toHaveValue('')
})

test('reopening history replaces API clock with confirmed delivery without a live status', async ({
  page,
}) => {
  await page.goto(PATH)
  await page.getByRole('button', { name: OPEN_A }).click()
  const input = page.getByRole('textbox', { name: LABEL, exact: true })
  await input.fill(TEXT)
  await expect(page.getByRole('button', { name: SEND })).toBeEnabled()
  await input.press(ENTER)
  await expect(
    page.getByRole('img', { name: ACCEPTED, exact: true }),
  ).toBeVisible()
  await page.route(API, (route) =>
    route.fulfill({
      json: {
        status: TEST_API_RESPONSE_OK,
        connectionScope: scopeA,
        chatId: chatA,
        messages: [
          {
            chatId: chatA,
            idMessage: SEND_ID,
            direction: TEST_MESSAGE_PROTOCOL_OUTGOING,
            kind: TEST_MESSAGE_PROTOCOL_TEXT,
            text: TEXT,
            timestamp: TIMESTAMP,
            acceptedAt: null,
            status: TEST_MESSAGE_PROTOCOL_DELIVERED,
          },
        ],
      },
    }),
  )
  await page.getByRole('button', { name: OPEN_B }).click()
  await page.getByRole('button', { name: OPEN_A }).click()
  await expect(
    page.getByRole('img', { name: DELIVERED, exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('img', { name: ACCEPTED, exact: true }),
  ).toHaveCount(0)
  await expect(page.getByText(TEXT, { exact: true })).toHaveCount(1)
})
