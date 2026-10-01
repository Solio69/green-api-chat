import { expect, test } from '@playwright/test'
import {
  BASE_URL,
  CREDENTIALS,
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
const { OUTPUT_SELECTOR, FORM_SELECTOR, ROLE_STATUS } = TEST_UI

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
  await expect(page.getByRole(ROLE_STATUS)).toHaveCount(0)
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
