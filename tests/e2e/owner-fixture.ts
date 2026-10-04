import { test as base, expect } from '@playwright/test'
import FAKE_RESET from './fixtures/reset-contract.json'

export const test = base.extend<{ resetFakeState: void }>({
  resetFakeState: [
    async ({ baseURL, playwright }, runScenario) => {
      if (!baseURL) throw new Error('E2E baseURL is required for fixture reset')
      const resetFake = async () => {
        // A separate API context cannot write into the scenario's cookie jar.
        const control = await playwright.request.newContext({ baseURL })
        try {
          const response = await control.post(FAKE_RESET.LOGIN_PATH, {
            data: {
              idInstance: FAKE_RESET.ID,
              apiTokenInstance: FAKE_RESET.TOKEN,
            },
          })
          if (
            response.status() !== 200 ||
            (await response.json()).status !== 'ok'
          )
            throw new Error(
              `E2E fixture reset failed: HTTP ${response.status()}`,
            )
        } finally {
          await control.dispose()
        }
      }
      try {
        await resetFake()
        await runScenario()
      } finally {
        await resetFake()
      }
    },
    { auto: true },
  ],
})
export { expect }
