import { createHmac } from 'node:crypto'
import type { BrowserContext } from '@playwright/test'
import { sealData } from 'iron-session'
import type { InstanceCredentials } from '@/lib/green-api/get-state'
import { TEST_SESSION_FIXTURES } from '../constants'

const { PASSWORD } = TEST_SESSION_FIXTURES
export const addChatSession = async ({
  context,
  baseURL,
  credentials,
}: {
  context: BrowserContext
  baseURL: string
  credentials: InstanceCredentials
}) => {
  const payload = { ...credentials, expiresAt: Date.now() + 60_000 }
  const value = await sealData(payload, { password: PASSWORD, ttl: 60 })
  await context.addCookies([
    { name: 'green-api-chat-session', value, url: baseURL },
  ])
  return createHmac('sha256', PASSWORD)
    .update(
      JSON.stringify([
        'chat-query-v1',
        payload.idInstance,
        payload.apiTokenInstance,
        payload.expiresAt,
      ]),
    )
    .digest('base64url')
}
