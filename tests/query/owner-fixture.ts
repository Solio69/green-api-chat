import { test as base, expect } from '@playwright/test'
import { MESSAGING_UI_TEST } from '../notifications/ui-constants'

const { CONTROL_API } = MESSAGING_UI_TEST

export const test = base.extend<{ resetQueryState: void }>({
  resetQueryState: [
    async ({ request }, runScenario) => {
      const reset = async () => {
        const response = await request.post(CONTROL_API, {
          data: { reset: true },
        })
        if (!response.ok())
          throw new Error(
            `Query fixture reset failed: HTTP ${response.status()}`,
          )
      }
      try {
        await reset()
        await runScenario()
      } finally {
        await reset()
      }
    },
    { auto: true },
  ],
})
export { expect }
