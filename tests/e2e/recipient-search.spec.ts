import type { Page } from '@playwright/test'
import { expect, test } from './owner-fixture'
import { EMPTY_STRING } from '@/lib/ui/constants'
import {
  CREDENTIALS,
  GREEN_API_CONTRACT,
  LOGIN_API_CONTRACT,
  LOGIN_CONTRACT,
  RECIPIENT_API_CONTRACT,
  RECIPIENT_CONTRACT,
  RECIPIENT_SCENARIOS,
  ROUTES,
  TEST_FETCH_CONTRACT,
  TEST_REQUEST_FIXTURES,
  TEST_UI,
} from '../constants'

const { ID, TOKEN } = CREDENTIALS
const { ID_LABEL, TOKEN_LABEL, SUBMIT: LOGIN_SUBMIT } = LOGIN_CONTRACT
const {
  LOGOUT,
  SEARCH_HEADING,
  PHONE_MODE,
  USERNAME_MODE,
  PHONE_LABEL,
  USERNAME_LABEL,
  SUBMIT,
  PENDING,
  FOUND,
  PHONE_NOT_FOUND,
  USERNAME_NOT_FOUND,
  SWITCH_TO_USERNAME,
  PHONE_REQUIRED,
  PHONE_INVALID,
  USERNAME_REQUIRED,
  USERNAME_INVALID,
  RATE_LIMITED,
  SERVICE_UNAVAILABLE,
} = RECIPIENT_CONTRACT
const {
  foundPhone,
  missingPhone,
  foundUsername,
  missingUsername,
  rateLimitedUsername,
  unauthorizedUsername,
  unavailableUsername,
  delayedUsername,
  chatId,
} = RECIPIENT_SCENARIOS
const { HOME, LOGIN, RECIPIENT_SEARCH_API } = ROUTES
const { MODE_PHONE, RESULT_FOUND, SESSION_REQUIRED } = RECIPIENT_API_CONTRACT
const {
  OK_STATUS,
  UNAUTHORIZED_STATUS,
  INVALID_REQUEST_STATUS,
  RESPONSE_OK,
  RESPONSE_ERROR,
  CACHE_CONTROL_HEADER,
  CACHE_CONTROL_VALUE,
  CONTENT_TYPE_HEADER,
  JSON_CONTENT_TYPE,
} = LOGIN_API_CONTRACT
const { INVALID_PHONE, INVALID_USERNAME } = TEST_REQUEST_FIXTURES
const { METHOD_POST } = TEST_FETCH_CONTRACT
const {
  ROLE_BUTTON,
  ROLE_HEADING,
  OUTPUT_SELECTOR,
  ATTR_ARIA_PRESSED,
  BOOLEAN_TRUE,
} = TEST_UI

const signIn = async (page: Page) => {
  await page.goto(LOGIN)
  await page.getByLabel(ID_LABEL, { exact: true }).fill(ID)
  await page.getByLabel(TOKEN_LABEL, { exact: true }).fill(TOKEN)
  await page.getByRole(ROLE_BUTTON, { name: LOGIN_SUBMIT, exact: true }).click()
  await expect(page).toHaveURL(HOME)
}

test('recipient search: fixture signs in and opens protected home', async ({
  page,
}) => {
  await signIn(page)
  await expect(page.getByRole('main')).toBeVisible()
  await expect(page.getByRole(ROLE_BUTTON, { name: LOGOUT })).toBeVisible()
})

test('recipient search: phone lookup shows the submitted recipient', async ({
  page,
}) => {
  const searches: string[] = []
  const sends: string[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.pathname === RECIPIENT_SEARCH_API)
      searches.push(request.postData() ?? EMPTY_STRING)
    if (url.pathname.includes(GREEN_API_CONTRACT.SEND_METHOD))
      sends.push(url.pathname)
  })
  await signIn(page)
  await expect(
    page.getByRole(ROLE_HEADING, { name: SEARCH_HEADING }),
  ).toBeVisible()
  await expect(
    page.getByRole(ROLE_BUTTON, { name: PHONE_MODE }),
  ).toHaveAttribute(ATTR_ARIA_PRESSED, BOOLEAN_TRUE)
  await page.getByLabel(PHONE_LABEL).fill(foundPhone)
  await page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }).click()
  await expect(page.getByText(FOUND, { exact: true })).toBeVisible()
  await expect(page.getByText(foundPhone, { exact: true })).toBeVisible()
  await expect(page.locator(OUTPUT_SELECTOR)).toHaveCount(0)
  expect(searches).toEqual([
    JSON.stringify({ mode: MODE_PHONE, value: foundPhone }),
  ])
  expect(sends).toHaveLength(0)
})

test('recipient search: phone miss offers username without automatic lookup', async ({
  page,
}) => {
  const searches: string[] = []
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === RECIPIENT_SEARCH_API)
      searches.push(request.postData() ?? EMPTY_STRING)
  })
  await signIn(page)
  await page.getByLabel(PHONE_LABEL).fill(missingPhone)
  await page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }).click()
  await expect(page.getByText(PHONE_NOT_FOUND, { exact: true })).toBeVisible()
  expect(searches).toHaveLength(1)

  await page.getByRole(ROLE_BUTTON, { name: SWITCH_TO_USERNAME }).click()
  await expect(page.getByLabel(USERNAME_LABEL)).toHaveValue(EMPTY_STRING)
  await expect(page.getByText(PHONE_NOT_FOUND, { exact: true })).toHaveCount(0)
  expect(searches).toHaveLength(1)

  await page.getByLabel(USERNAME_LABEL).fill(missingUsername)
  await page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }).click()
  await expect(
    page.getByText(USERNAME_NOT_FOUND, { exact: true }),
  ).toBeVisible()
  await page.getByLabel(USERNAME_LABEL).fill(`@${foundUsername}`)
  await expect(page.getByText(USERNAME_NOT_FOUND, { exact: true })).toHaveCount(
    0,
  )
  await page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }).click()
  await expect(
    page.getByText(`@${foundUsername}`, { exact: true }),
  ).toBeVisible()
  await page.getByLabel(USERNAME_LABEL).fill(foundUsername)
  await page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }).click()
  await expect(
    page.getByText(`@${foundUsername}`, { exact: true }),
  ).toBeVisible()
  expect(searches).toHaveLength(4)
})

test('recipient search: invalid input is corrected before a request', async ({
  page,
}) => {
  const searches: string[] = []
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === RECIPIENT_SEARCH_API)
      searches.push(request.postData() ?? EMPTY_STRING)
  })
  await signIn(page)
  await page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }).click()
  await expect(page.getByText(PHONE_REQUIRED, { exact: true })).toBeVisible()
  await page.getByLabel(PHONE_LABEL).fill(INVALID_PHONE)
  await expect(page.getByText(PHONE_INVALID, { exact: true })).toBeVisible()
  expect(searches).toHaveLength(0)
  await page.getByLabel(PHONE_LABEL).fill(foundPhone)
  await expect(page.getByText(PHONE_INVALID, { exact: true })).toHaveCount(0)
  await page.getByLabel(PHONE_LABEL).press(TEST_UI.KEY_ENTER)
  await expect(page.getByText(foundPhone, { exact: true })).toBeVisible()
  expect(searches).toHaveLength(1)
  await page.getByRole(ROLE_BUTTON, { name: USERNAME_MODE }).click()
  await page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }).click()
  await expect(page.getByText(USERNAME_REQUIRED, { exact: true })).toBeVisible()
  await page.getByLabel(USERNAME_LABEL).fill(INVALID_USERNAME)
  await expect(page.getByText(USERNAME_INVALID, { exact: true })).toBeVisible()
  await page.getByLabel(USERNAME_LABEL).fill(foundUsername)
  await expect(page.getByText(USERNAME_INVALID, { exact: true })).toHaveCount(0)
  expect(searches).toHaveLength(1)
})

test('recipient search: pending state blocks edits and reload clears result', async ({
  page,
}) => {
  await signIn(page)
  await page.getByRole(ROLE_BUTTON, { name: USERNAME_MODE }).click()
  await page.getByLabel(USERNAME_LABEL).fill(delayedUsername)
  await page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }).click()
  await expect(page.getByRole(ROLE_BUTTON, { name: PENDING })).toBeDisabled()
  await expect(page.getByRole(ROLE_BUTTON, { name: PHONE_MODE })).toBeDisabled()
  await expect(page.getByLabel(USERNAME_LABEL)).toBeDisabled()
  await expect(
    page.getByText(`@${delayedUsername}`, { exact: true }),
  ).toBeVisible()
  await page.reload()
  await expect(page.getByLabel(PHONE_LABEL)).toHaveValue(EMPTY_STRING)
  await expect(
    page.getByText(`@${delayedUsername}`, { exact: true }),
  ).toHaveCount(0)
})

test('recipient search: limit and outage preserve the session for retry', async ({
  page,
}) => {
  await signIn(page)
  await page.getByRole(ROLE_BUTTON, { name: USERNAME_MODE }).click()
  await page.getByLabel(USERNAME_LABEL).fill(rateLimitedUsername)
  await page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }).click()
  await expect(page.getByText(RATE_LIMITED, { exact: true })).toBeVisible()
  await page.getByLabel(USERNAME_LABEL).fill(unavailableUsername)
  await page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }).click()
  await expect(
    page.getByText(SERVICE_UNAVAILABLE, { exact: true }),
  ).toBeVisible()
  await expect(page).toHaveURL(HOME)
  await page.getByLabel(USERNAME_LABEL).fill(foundUsername)
  await page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }).click()
  await expect(
    page.getByText(`@${foundUsername}`, { exact: true }),
  ).toBeVisible()
})

test('recipient search: confirmed invalid token ends the browser session', async ({
  page,
}) => {
  await signIn(page)
  await page.getByRole(ROLE_BUTTON, { name: USERNAME_MODE }).click()
  await page.getByLabel(USERNAME_LABEL).fill(unauthorizedUsername)
  await page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }).click()
  await expect(page).toHaveURL(LOGIN)
  await page.goto(HOME)
  await expect(page).toHaveURL(LOGIN)
})

test('recipient search: API requires session and returns only safe data', async ({
  page,
}) => {
  const noSession = await page.request.post(RECIPIENT_SEARCH_API, {
    data: { mode: MODE_PHONE, value: foundPhone },
  })
  expect(noSession.status()).toBe(UNAUTHORIZED_STATUS)
  expect(await noSession.json()).toEqual({
    status: RESPONSE_ERROR,
    code: SESSION_REQUIRED,
  })

  await signIn(page)
  const requestOptions = {
    url: RECIPIENT_SEARCH_API,
    mode: MODE_PHONE,
    method: METHOD_POST,
    contentTypeHeader: CONTENT_TYPE_HEADER,
    contentType: JSON_CONTENT_TYPE,
    cacheControlHeader: CACHE_CONTROL_HEADER,
  }
  const invalid = await page.evaluate(
    async (options) => {
      const response = await fetch(options.url, {
        method: options.method,
        headers: { [options.contentTypeHeader]: options.contentType },
        body: JSON.stringify({ mode: options.mode, value: options.value }),
      })
      return response.status
    },
    { ...requestOptions, value: INVALID_PHONE },
  )
  expect(invalid).toBe(INVALID_REQUEST_STATUS)
  const found = await page.evaluate(
    async ({
      url,
      mode,
      method,
      contentTypeHeader,
      contentType,
      cacheControlHeader,
      value,
    }) => {
      const response = await fetch(url, {
        method,
        headers: { [contentTypeHeader]: contentType },
        body: JSON.stringify({ mode, value }),
      })
      return {
        status: response.status,
        body: await response.json(),
        cacheControl: response.headers.get(cacheControlHeader),
      }
    },
    { ...requestOptions, value: foundPhone },
  )
  expect(found.status).toBe(OK_STATUS)
  expect(found.body).toEqual({
    status: RESPONSE_OK,
    result: RESULT_FOUND,
    chatId,
  })
  expect(found.cacheControl).toBe(CACHE_CONTROL_VALUE)
  expect(JSON.stringify(found.body)).not.toContain(TOKEN)
})
