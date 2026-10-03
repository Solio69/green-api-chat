import { describe, expect, test, vi } from 'vitest'
import { requestRecipientSearch } from '@/features/recipients/ui/RecipientSearchForm/request-recipient-search'
import { RECIPIENT_SCENARIOS } from '../constants'

const { foundPhone, chatId } = RECIPIENT_SCENARIOS
const signal = new AbortController().signal

describe('recipient search client adapter', () => {
  test('sends the selected mode and raw value once, returns only safe found data', async () => {
    const fetcher = vi.fn(async () =>
      Response.json({
        status: 'ok',
        result: 'found',
        chatId,
        extra: 'ignored',
      }),
    )
    const outcome = await requestRecipientSearch({
      mode: 'phone',
      value: foundPhone,
      signal,
      fetcher,
    })
    expect(fetcher).toHaveBeenCalledWith('/api/recipients/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'phone', value: foundPhone }),
      cache: 'no-store',
      signal,
    })
    expect(outcome).toEqual({ kind: 'found', chatId })
  })

  test.each([
    [
      Response.json({ status: 'ok', result: 'not_found' }),
      { kind: 'not_found' },
    ],
    [new Response(null, { status: 401 }), { kind: 'access-lost' }],
    [
      Response.json({ status: 'error', code: 'rate_limited' }, { status: 429 }),
      { kind: 'error', code: 'rate_limited' },
    ],
    [
      Response.json({ status: 'ok', result: 'found', chatId: '' }),
      { kind: 'error', code: 'invalid_upstream_response' },
    ],
    [
      new Response('invalid json', { status: 502 }),
      { kind: 'error', code: 'invalid_upstream_response' },
    ],
  ])(
    'distinguishes absence, access loss and failures',
    async (response, expected) => {
      expect(
        await requestRecipientSearch({
          mode: 'phone',
          value: foundPhone,
          signal,
          fetcher: vi.fn(async () => response),
        }),
      ).toEqual(expected)
    },
  )

  test('maps transport failure without confirming absence', async () => {
    expect(
      await requestRecipientSearch({
        mode: 'username',
        value: 'fictional_name',
        signal,
        fetcher: vi.fn(async () => {
          throw new Error('fictional outage')
        }),
      }),
    ).toEqual({ kind: 'error', code: 'service_unavailable' })
  })
})
