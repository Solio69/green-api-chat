import { test as base, expect } from '@playwright/test'
import type { Response } from '@playwright/test'

const OWNER_FIXTURE = {
  CLAIM_PATH: '/api/notifications/claim',
  RELEASE_PATH: '/api/notifications/release',
  SCOPE_HEADER: 'X-Connection-Scope',
  OWNER_HEADER: 'X-Chat-Owner',
  ORIGIN_HEADER: 'Origin',
  COOKIE_HEADER: 'Cookie',
} as const
const {
  CLAIM_PATH,
  RELEASE_PATH,
  SCOPE_HEADER,
  OWNER_HEADER,
  ORIGIN_HEADER,
  COOKIE_HEADER,
} = OWNER_FIXTURE
export const test = base.extend({
  context: async ({ context, baseURL }, provideContext) => {
    const claims: Promise<{
      scope: string
      owner: string
      cookie: string
    } | null>[] = []
    const record = (response: Response) => {
      const successfulClaim =
        response.url().endsWith(CLAIM_PATH) && response.status() === 200
      if (!successfulClaim) return
      claims.push(
        (async () => {
          const body = await response.json()
          const headers = await response.request().allHeaders()
          return {
            scope: body.connectionScope,
            owner: body.ownerCapability,
            cookie: headers.cookie ?? '',
          }
        })().catch(() => null),
      )
    }
    context.on('page', (page) => page.on('response', record))
    await provideContext(context)
    for (const claim of await Promise.all(claims)) {
      if (!claim) continue
      await context.request
        .post(`${baseURL}${RELEASE_PATH}`, {
          data: {},
          headers: {
            [SCOPE_HEADER]: claim.scope,
            [OWNER_HEADER]: claim.owner,
            [ORIGIN_HEADER]: baseURL!,
            [COOKIE_HEADER]: claim.cookie,
          },
        })
        .catch(() => undefined)
    }
  },
})
export { expect }
