import { expect, test } from './owner-fixture'
import {
  HEALTH_CONTRACT,
  JSON_CONTENT_TYPE,
  ROUTES,
  TEST_TIMEOUTS,
} from '../constants'

const {
  HTTP_OK,
  METHOD_NOT_ALLOWED,
  CONTENT_TYPE_HEADER,
  CACHE_CONTROL_HEADER,
  CACHE_CONTROL_VALUE,
  RESPONSE_STATUS,
} = HEALTH_CONTRACT
const { HEALTH } = ROUTES
const { REQUEST: REQUEST_TIMEOUT } = TEST_TIMEOUTS

const REQUEST_OPTIONS = {
  timeout: REQUEST_TIMEOUT,
  maxRedirects: 0,
  failOnStatusCode: false,
} as const

test('returns the health contract on consecutive GET requests', async ({
  request,
}) => {
  for (let requestNumber = 1; requestNumber <= 2; requestNumber += 1) {
    await test.step(`GET request ${requestNumber}`, async () => {
      const response = await request.get(HEALTH, REQUEST_OPTIONS)
      const headers = response.headers()

      expect(response.status()).toBe(HTTP_OK)
      expect(headers[CONTENT_TYPE_HEADER]).toMatch(JSON_CONTENT_TYPE)
      expect(headers[CACHE_CONTROL_HEADER]).toBe(CACHE_CONTROL_VALUE)
      expect(await response.json()).toEqual({ status: RESPONSE_STATUS })
    })
  }
})

test('rejects POST for the health endpoint', async ({ request }) => {
  const response = await request.post(HEALTH, REQUEST_OPTIONS)

  expect(response.status()).toBe(METHOD_NOT_ALLOWED)
})
