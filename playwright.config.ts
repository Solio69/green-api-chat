import { defineConfig, devices } from '@playwright/test';

import {
  BASE_URL,
  ROUTES,
  TEST_SERVER,
  TEST_TIMEOUTS,
} from './tests/e2e/constants';

const { HOME } = ROUTES;
const { HOST, PORT } = TEST_SERVER;
const { ACTION, EXPECT, NAVIGATION, RUN, SERVER_START, TEST } = TEST_TIMEOUTS;

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  globalTimeout: RUN,
  timeout: TEST,
  expect: {
    timeout: EXPECT,
  },
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  outputDir: 'test-results',
  use: {
    baseURL: BASE_URL,
    headless: true,
    actionTimeout: ACTION,
    navigationTimeout: NAVIGATION,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run build && npm run start -- --hostname ${HOST} --port ${PORT}`,
    url: `${BASE_URL}${HOME}`,
    reuseExistingServer: false,
    timeout: SERVER_START,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      NEXT_TELEMETRY_DISABLED: '1',
    },
  },
});
