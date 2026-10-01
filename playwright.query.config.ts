import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/query',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  timeout: 15_000,
  expect: { timeout: 3_000 },
  reporter: [['list']],
  outputDir: 'test-results/query',
  use: {
    baseURL: 'http://127.0.0.1:3102',
    headless: true,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command:
      'node node_modules/next/dist/bin/next build tests/fixtures/query-app --webpack && node node_modules/next/dist/bin/next start tests/fixtures/query-app --hostname 127.0.0.1 --port 3102',
    url: 'http://127.0.0.1:3102',
    reuseExistingServer: false,
    timeout: 180_000,
    env: { NEXT_TELEMETRY_DISABLED: '1' },
  },
})
