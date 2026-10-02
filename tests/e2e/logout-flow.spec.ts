import { expect, test } from './owner-fixture'
import { EMPTY_STRING } from '@/lib/ui/constants'
import {
  BASE_URL,
  CREDENTIALS,
  LOGIN_API_CONTRACT,
  LOGIN_CONTRACT,
  RECIPIENT_CONTRACT,
  LOGOUT_CONTRACT,
  ROUTES,
  SESSION_CONTRACT,
  TEST_UI,
} from '../constants'

const { HOME, LOGIN, LOGOUT_API } = ROUTES
const { ID, TOKEN } = CREDENTIALS
const { COOKIE_NAME, EXPIRED_COOKIE_PATTERN } = SESSION_CONTRACT
const {
  REDIRECT_STATUS,
  METHOD_NOT_ALLOWED_STATUS,
  REDIRECT_URL,
  COOKIE_VALUE,
  LOCATION_HEADER,
  SET_COOKIE_HEADER,
  CACHE_CONTROL_HEADER,
  CACHE_CONTROL_VALUE,
} = LOGOUT_CONTRACT
const {
  OUTPUT_SELECTOR,
  FORM_SELECTOR,
  ROLE_STATUS,
  ROLE_BUTTON,
  EVENT_REQUEST,
} = TEST_UI
const { ID_LABEL, TOKEN_LABEL, SUBMIT } = LOGIN_CONTRACT
const { LOGOUT } = RECIPIENT_CONTRACT
const {
  UNAVAILABLE_STATUS,
  JSON_CONTENT_TYPE,
  RESPONSE_ERROR,
  SERVICE_UNAVAILABLE,
} = LOGIN_API_CONTRACT
const LOGOUT_ERROR = 'Не удалось выйти. Попробуйте ещё раз.'

test('logout: POST clears the browser cookie and redirects to login', async ({
  context,
  page,
}) => {
  await context.addCookies([
    { name: COOKIE_NAME, value: COOKIE_VALUE, url: BASE_URL },
  ])

  const response = await context.request.post(LOGOUT_API, { maxRedirects: 0 })
  const headers = response.headers()

  expect(response.status()).toBe(REDIRECT_STATUS)
  expect(headers[LOCATION_HEADER.toLowerCase()]).toBe(REDIRECT_URL)
  expect(headers[SET_COOKIE_HEADER.toLowerCase()]).toMatch(
    EXPIRED_COOKIE_PATTERN,
  )
  expect(headers[CACHE_CONTROL_HEADER.toLowerCase()]).toBe(CACHE_CONTROL_VALUE)
  expect(headers[LOCATION_HEADER.toLowerCase()]).not.toContain(ID)
  expect(headers[LOCATION_HEADER.toLowerCase()]).not.toContain(TOKEN)
  expect(
    (await context.cookies(BASE_URL)).some(({ name }) => name === COOKIE_NAME),
  ).toBe(false)

  await page.goto(HOME)
  await expect(page).toHaveURL(LOGIN)
  await expect(page.locator(OUTPUT_SELECTOR)).toHaveCount(0)
  await expect(page.locator(FORM_SELECTOR)).toBeVisible()
  await expect(page.getByRole(ROLE_STATUS)).toHaveText(EMPTY_STRING)
})

test('logout: missing cookie is safe and GET does not clear cookies', async ({
  context,
}) => {
  const repeatResponse = await context.request.post(LOGOUT_API, {
    maxRedirects: 0,
  })

  expect(repeatResponse.status()).toBe(REDIRECT_STATUS)
  expect(repeatResponse.headers()[LOCATION_HEADER.toLowerCase()]).toBe(
    REDIRECT_URL,
  )

  await context.addCookies([
    { name: COOKIE_NAME, value: COOKIE_VALUE, url: BASE_URL },
  ])
  const getResponse = await context.request.get(LOGOUT_API, { maxRedirects: 0 })

  expect(getResponse.status()).toBe(METHOD_NOT_ALLOWED_STATUS)
  expect(
    (await context.cookies(BASE_URL)).some(({ name }) => name === COOKIE_NAME),
  ).toBe(true)
})

test('logout: browser exits without reloading the document', async ({
  page,
  context,
}) => {
  await page.goto(LOGIN)
  await page.getByLabel(ID_LABEL, { exact: true }).fill(ID)
  await page.getByLabel(TOKEN_LABEL, { exact: true }).fill(TOKEN)
  await page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }).click()
  await expect(page).toHaveURL(HOME)
  expect(
    (await context.cookies()).some(({ name }) => name === COOKIE_NAME),
  ).toBe(true)
  let documentNavigations = 0
  page.on(EVENT_REQUEST, (request) => {
    const isMainNavigation =
      request.isNavigationRequest() && request.frame() === page.mainFrame()
    if (isMainNavigation) documentNavigations += 1
  })
  await page.getByRole(ROLE_BUTTON, { name: LOGOUT, exact: true }).click()
  await expect(page).toHaveURL(LOGIN)
  await expect(page.getByLabel(ID_LABEL, { exact: true })).toBeEnabled()
  expect(documentNavigations).toBe(0)
  expect(
    (await context.cookies()).some(({ name }) => name === COOKIE_NAME),
  ).toBe(false)
  await page.goto(HOME)
  await expect(page).toHaveURL(LOGIN)
})

test('logout: failed request preserves the page and permits retry', async ({
  page,
  context,
}) => {
  await page.goto(LOGIN)
  await page.getByLabel(ID_LABEL, { exact: true }).fill(ID)
  await page.getByLabel(TOKEN_LABEL, { exact: true }).fill(TOKEN)
  await page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }).click()
  await expect(page).toHaveURL(HOME)
  expect(
    (await context.cookies()).some(({ name }) => name === COOKIE_NAME),
  ).toBe(true)
  await page.route(`**${LOGOUT_API}`, (route) =>
    route.fulfill({
      status: UNAVAILABLE_STATUS,
      contentType: JSON_CONTENT_TYPE,
      body: JSON.stringify({
        status: RESPONSE_ERROR,
        code: SERVICE_UNAVAILABLE,
      }),
    }),
  )
  await page.getByRole(ROLE_BUTTON, { name: LOGOUT, exact: true }).click()
  await expect(page.getByText(LOGOUT_ERROR, { exact: true })).toBeVisible()
  await expect(page).toHaveURL(HOME)
  await expect(
    page.getByRole(ROLE_BUTTON, { name: LOGOUT, exact: true }),
  ).toBeEnabled()
  expect(
    (await context.cookies()).some(({ name }) => name === COOKIE_NAME),
  ).toBe(true)
  await page.unroute(`**${LOGOUT_API}`)
  await page.getByRole(ROLE_BUTTON, { name: LOGOUT, exact: true }).click()
  await expect(page).toHaveURL(LOGIN)
})
