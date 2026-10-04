import { describe, expect, test, vi } from 'vitest'
import { requestLogin } from '@/features/auth/ui/LoginForm/request-login'
import { requestLogout } from '@/features/auth/ui/LogoutButton/request-logout'
import { CREDENTIALS } from '../constants'

const credentials = {
  idInstance: CREDENTIALS.ID,
  apiTokenInstance: CREDENTIALS.TOKEN,
}
const signal = new AbortController().signal

describe('login client adapter', () => {
  test('sends only the configured POST body and returns no credentials on success', async () => {
    const fetcher = vi.fn(async () => Response.json({ status: 'ok' }))
    const result = await requestLogin({ credentials, signal, fetcher })
    expect(fetcher).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
      cache: 'no-store',
      signal,
    })
    expect(result).toEqual({ kind: 'success' })
  })

  test.each([
    [
      Response.json(
        { status: 'error', code: 'invalid_token' },
        { status: 401 },
      ),
      'invalid_token',
    ],
    [
      Response.json({ status: 'error', code: 'unknown' }, { status: 503 }),
      'invalid_upstream_response',
    ],
    [
      new Response('invalid json', { status: 502 }),
      'invalid_upstream_response',
    ],
  ])(
    'maps a rejected or malformed response without returning secrets',
    async (response, code) => {
      const result = await requestLogin({
        credentials,
        signal,
        fetcher: vi.fn(async () => response),
      })
      expect(result).toEqual({ kind: 'error', code })
      expect(JSON.stringify(result)).not.toContain(credentials.apiTokenInstance)
    },
  )

  test('maps network failure to the existing service error', async () => {
    const result = await requestLogin({
      credentials,
      signal,
      fetcher: vi.fn(async () => {
        throw new Error('fictional outage')
      }),
    })
    expect(result).toEqual({ kind: 'error', code: 'service_unavailable' })
  })
})

describe('logout client adapter', () => {
  test('uses owned headers and reports HTTP success', async () => {
    const headers = new Headers({ 'X-Owner': 'fictional-tab' })
    const fetcher = vi.fn(async () => new Response(null, { status: 204 }))
    expect(await requestLogout({ headers, fetcher })).toBe(true)
    expect(fetcher).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST',
      headers,
      cache: 'no-store',
    })
  })

  test('reports HTTP and transport failures for retry', async () => {
    expect(
      await requestLogout({
        fetcher: vi.fn(async () => new Response(null, { status: 503 })),
      }),
    ).toBe(false)
    expect(
      await requestLogout({
        fetcher: vi.fn(async () => {
          throw new Error('fictional outage')
        }),
      }),
    ).toBe(false)
  })
})
