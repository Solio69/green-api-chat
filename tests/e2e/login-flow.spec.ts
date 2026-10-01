import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import {
  BASE_URL,
  CREDENTIALS,
  GREEN_API_CONTRACT,
  LOGIN_API_CONTRACT,
  LOGIN_CONTRACT,
  ROUTE_PATTERNS,
  ROUTES,
  TEST_BROWSER_FIXTURES,
  TEST_FETCH_CONTRACT,
  TEST_UI,
} from '../constants'

const { HOME, LOGIN } = ROUTES
const { LOGIN_API: LOGIN_API_ROUTE_PATTERN } = ROUTE_PATTERNS
const { ID, TOKEN } = CREDENTIALS
const { ID_LABEL, TOKEN_LABEL, SUBMIT } = LOGIN_CONTRACT
const { AUTHORIZED } = GREEN_API_CONTRACT
const {
  OK_STATUS,
  UNAUTHORIZED_STATUS,
  RATE_LIMIT_STATUS,
  UNAVAILABLE_STATUS,
  RESPONSE_OK,
  RESPONSE_ERROR,
  INVALID_TOKEN,
  INVALID_INSTANCE,
  SERVICE_UNAVAILABLE,
  RETRY_LATER,
  RATE_LIMITED,
  JSON_CONTENT_TYPE,
} = LOGIN_API_CONTRACT
const { HTML_CONTENT_TYPE } = TEST_BROWSER_FIXTURES
const { METHOD_POST } = TEST_FETCH_CONTRACT
const { ROLE_BUTTON, OUTPUT_SELECTOR, ATTR_ARIA_INVALID, BOOLEAN_TRUE } =
  TEST_UI
const AUTHORIZED_JSON = JSON.stringify({ stateInstance: AUTHORIZED })
const HOME_HTML = `<main><pre>${AUTHORIZED_JSON}</pre></main>`

async function fillCredentials(page: Page) {
  await page.getByLabel(ID_LABEL, { exact: true }).fill(ID)
  await page.getByLabel(TOKEN_LABEL, { exact: true }).fill(TOKEN)
}

test('login flow: direct home visit without a session redirects to login', async ({
  page,
}) => {
  await page.goto(HOME)
  await expect(page).toHaveURL(LOGIN)
  await expect(page.locator(OUTPUT_SELECTOR)).toHaveCount(0)
})

test('login flow: authorized response opens home after one POST', async ({
  page,
}) => {
  let posts = 0
  await page.route(LOGIN_API_ROUTE_PATTERN, async (route) => {
    posts += 1
    expect(route.request().method()).toBe(METHOD_POST)
    expect(route.request().postDataJSON()).toEqual({
      idInstance: ID,
      apiTokenInstance: TOKEN,
    })
    await route.fulfill({
      status: OK_STATUS,
      contentType: JSON_CONTENT_TYPE,
      body: JSON.stringify({ status: RESPONSE_OK }),
    })
  })
  await page.route(`${BASE_URL}${HOME}`, async (route) => {
    await route.fulfill({
      status: OK_STATUS,
      contentType: HTML_CONTENT_TYPE,
      body: HOME_HTML,
    })
  })
  await page.goto(LOGIN)
  await fillCredentials(page)
  await page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }).click()
  await expect(page).toHaveURL(HOME)
  await expect(page.locator(OUTPUT_SELECTOR)).toHaveText(AUTHORIZED_JSON)
  expect(posts).toBe(1)
})

test('login flow: invalid token is shown at token field and input remains', async ({
  page,
}) => {
  await page.route(LOGIN_API_ROUTE_PATTERN, async (route) => {
    await route.fulfill({
      status: UNAUTHORIZED_STATUS,
      contentType: JSON_CONTENT_TYPE,
      body: JSON.stringify({ status: RESPONSE_ERROR, code: INVALID_TOKEN }),
    })
  })
  await page.goto(LOGIN)
  await fillCredentials(page)
  await page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }).click()
  await expect(page).toHaveURL(LOGIN)
  await expect(
    page.getByText(LOGIN_CONTRACT.INVALID_TOKEN, { exact: true }),
  ).toBeVisible()
  await expect(page.getByLabel(TOKEN_LABEL, { exact: true })).toHaveValue(TOKEN)
  await expect(page.getByLabel(TOKEN_LABEL, { exact: true })).toHaveAttribute(
    ATTR_ARIA_INVALID,
    BOOLEAN_TRUE,
  )
})

test('login flow: unavailable provider allows correction and retry', async ({
  page,
}) => {
  let posts = 0
  await page.route(LOGIN_API_ROUTE_PATTERN, async (route) => {
    posts += 1
    await route.fulfill({
      status: posts === 1 ? UNAVAILABLE_STATUS : UNAUTHORIZED_STATUS,
      contentType: JSON_CONTENT_TYPE,
      body: JSON.stringify({
        status: RESPONSE_ERROR,
        code: posts === 1 ? SERVICE_UNAVAILABLE : INVALID_INSTANCE,
      }),
    })
  })
  await page.goto(LOGIN)
  await fillCredentials(page)
  await page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }).click()
  await expect(
    page.getByText(LOGIN_CONTRACT.SERVICE_UNAVAILABLE, {
      exact: true,
    }),
  ).toBeVisible()
  await page.getByLabel(ID_LABEL, { exact: true }).fill(`${ID}1`)
  await expect(
    page.getByText(LOGIN_CONTRACT.SERVICE_UNAVAILABLE, {
      exact: true,
    }),
  ).toHaveCount(0)
  await page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }).click()
  await expect(
    page.getByText(LOGIN_CONTRACT.INVALID_INSTANCE, { exact: true }),
  ).toBeVisible()
  expect(posts).toBe(2)
})

test('login flow: pending POST blocks duplicate submissions', async ({
  page,
}) => {
  let posts = 0
  let release: (() => void) | undefined
  await page.route(LOGIN_API_ROUTE_PATTERN, async (route) => {
    posts += 1
    await new Promise<void>((resolve) => {
      release = resolve
    })
    await route.fulfill({
      status: UNAVAILABLE_STATUS,
      contentType: JSON_CONTENT_TYPE,
      body: JSON.stringify({ status: RESPONSE_ERROR, code: RETRY_LATER }),
    })
  })
  await page.goto(LOGIN)
  await fillCredentials(page)
  await page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }).click()
  await expect(
    page.getByRole(ROLE_BUTTON, { name: LOGIN_CONTRACT.PENDING, exact: true }),
  ).toBeDisabled()
  expect(posts).toBe(1)
  release?.()
  await expect(
    page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }),
  ).toBeEnabled()
  expect(posts).toBe(1)
})

test('login flow: exhausted rate limit explains when to try again', async ({
  page,
}) => {
  await page.route(LOGIN_API_ROUTE_PATTERN, async (route) => {
    await route.fulfill({
      status: RATE_LIMIT_STATUS,
      contentType: JSON_CONTENT_TYPE,
      body: JSON.stringify({ status: RESPONSE_ERROR, code: RATE_LIMITED }),
    })
  })
  await page.goto(LOGIN)
  await fillCredentials(page)
  await page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }).click()
  await expect(
    page.getByText(LOGIN_CONTRACT.RATE_LIMITED, {
      exact: true,
    }),
  ).toBeVisible()
  await expect(page).toHaveURL(LOGIN)
})
