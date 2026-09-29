import { expect, test } from '@playwright/test';

import {
  CACHE_CONTROL,
  HEALTH_RESPONSE,
  HTTP_HEADERS,
  HTTP_STATUS,
  JSON_CONTENT_TYPE,
  ROUTES,
  TEST_TIMEOUTS,
} from './constants';

const { NO_STORE } = CACHE_CONTROL;
const { CONTENT_TYPE, CACHE_CONTROL: CACHE_CONTROL_HEADER } = HTTP_HEADERS;
const { OK: HTTP_OK, METHOD_NOT_ALLOWED } = HTTP_STATUS;
const { HEALTH } = ROUTES;
const { REQUEST: REQUEST_TIMEOUT } = TEST_TIMEOUTS;

const REQUEST_OPTIONS = {
  timeout: REQUEST_TIMEOUT,
  maxRedirects: 0,
  failOnStatusCode: false,
} as const;

test('returns the health contract on consecutive GET requests', async ({
  request,
}) => {
  for (let requestNumber = 1; requestNumber <= 2; requestNumber += 1) {
    await test.step(`GET request ${requestNumber}`, async () => {
      const response = await request.get(HEALTH, REQUEST_OPTIONS);
      const headers = response.headers();

      expect(response.status()).toBe(HTTP_OK);
      expect(headers[CONTENT_TYPE]).toMatch(JSON_CONTENT_TYPE);
      expect(headers[CACHE_CONTROL_HEADER]).toBe(NO_STORE);
      expect(await response.json()).toEqual(HEALTH_RESPONSE);
    });
  }
});

test('rejects POST for the health endpoint', async ({ request }) => {
  const response = await request.post(HEALTH, REQUEST_OPTIONS);

  expect(response.status()).toBe(METHOD_NOT_ALLOWED);
});
