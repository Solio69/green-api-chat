import { expect, test } from './owner-fixture'
import { SESSION_CHAT_TEST } from '../chats/session-constants'
import { TEST_UI } from '../constants'
import { HISTORY_TEST } from '../history/constants'

const { scopeA, SUCCESS, ERROR, STATUS, CODE } = HISTORY_TEST
const { UNAVAILABLE } = STATUS
const { UNAVAILABLE: SERVICE_UNAVAILABLE } = CODE
const { LABEL, ADD, REFRESH, PATH, API } = SESSION_CHAT_TEST
const { ROLE_BUTTON } = TEST_UI
test('session overlay: a pending known chat remains visible after empty and failed list refresh', async ({
  page,
}) => {
  let fail = false
  await page.route(API, (route) =>
    route.fulfill(
      fail
        ? {
            status: UNAVAILABLE,
            json: { status: ERROR, code: SERVICE_UNAVAILABLE },
          }
        : { json: { status: SUCCESS, connectionScope: scopeA, chats: [] } },
    ),
  )
  await page.goto(PATH)
  await page.getByRole(ROLE_BUTTON, { name: ADD, exact: true }).click()
  await expect(
    page.getByRole(ROLE_BUTTON, { name: LABEL, exact: true }),
  ).toBeVisible()
  await page.getByRole(ROLE_BUTTON, { name: REFRESH, exact: true }).click()
  await expect(
    page.getByRole(ROLE_BUTTON, { name: LABEL, exact: true }),
  ).toBeVisible()
  fail = true
  await page.getByRole(ROLE_BUTTON, { name: REFRESH, exact: true }).click()
  await expect(
    page.getByRole(ROLE_BUTTON, { name: LABEL, exact: true }),
  ).toBeVisible()
})
