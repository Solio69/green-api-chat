import { expect, it } from 'vitest'
import { createNotificationTransport } from '@/lib/notifications/notification-transport'
import { createQuerySession } from '@/lib/query/create-query-session'

it('uses the supplied clock for an HTTP-date Retry-After', async () => {
  const fixedNow = Date.UTC(2025, 0, 1)
  const session = createQuerySession({ connectionScope: 'fictional-scope' })
  try {
    const post = createNotificationTransport({
      session,
      now: () => fixedNow,
      fetcher: async () =>
        Response.json(
          { status: 'error', code: 'retry_later' },
          {
            status: 429,
            headers: { 'Retry-After': 'Wed, 01 Jan 2025 00:00:03 GMT' },
          },
        ),
    })
    await expect(
      post({
        url: '/api/notifications/receive',
        body: { ownerEpoch: 'fictional-epoch' },
        signal: new AbortController().signal,
      }),
    ).rejects.toMatchObject({ retryAfterMs: 3_000 })
  } finally {
    await session.close()
  }
})
