import { expect, test } from '@playwright/test'
import { addChatSession } from '../chats/helpers'
import { CHAT_FIXTURES } from '../chats/constants'

const { credentials, chat, scopeB } = CHAT_FIXTURES
test('chats HTTP: no session and unsupported methods do not call provider', async ({
  request,
}) => {
  const result = await request.get('/api/chats')
  expect(result.status()).toBe(401)
  expect(await result.json()).toEqual({
    status: 'error',
    code: 'session_required',
  })
  expect(result.headers()['cache-control']).toBe('no-store')
  expect((await request.post('/api/chats')).status()).toBe(405)
  const options = await request.fetch('/api/chats', { method: 'OPTIONS' })
  expect(options.status()).toBe(204)
  expect(options.headers().allow).toBe('GET, HEAD, OPTIONS')
})
test('chats HTTP: safe real route result, HEAD, mismatch does not destroy session', async ({
  context,
  baseURL,
}) => {
  const scope = await addChatSession({
    context,
    baseURL: baseURL!,
    credentials,
  })
  const headers = { 'X-Connection-Scope': scope }
  const result = await context.request.get('/api/chats', { headers })
  expect(result.status()).toBe(200)
  expect(await result.json()).toEqual({
    status: 'ok',
    connectionScope: scope,
    chats: [chat],
  })
  expect(await result.text()).not.toContain(credentials.apiTokenInstance)
  expect(await result.text()).not.toContain(credentials.idInstance)
  const head = await context.request.head('/api/chats', { headers })
  expect(head.status()).toBe(200)
  expect(await head.text()).toBe('')
  const mismatch = await context.request.get('/api/chats', {
    headers: { 'X-Connection-Scope': scopeB },
  })
  expect(mismatch.status()).toBe(409)
  expect((await context.request.get('/api/chats', { headers })).status()).toBe(
    200,
  )
})
for (const [id, status, code, cleared] of [
  ['99001403', 401, 'session_required', true],
  ['99001404', 503, 'service_unavailable', false],
] as const) {
  test(`chats HTTP: cookie on provider ${status}`, async ({
    context,
    baseURL,
  }) => {
    const scope = await addChatSession({
      context,
      baseURL: baseURL!,
      credentials: { ...credentials, idInstance: id },
    })
    const response = await context.request.get('/api/chats', {
      headers: { 'X-Connection-Scope': scope },
    })
    expect(response.status()).toBe(status)
    expect(await response.json()).toEqual({ status: 'error', code })
    expect(
      (await context.cookies()).some(
        ({ name }) => name === 'green-api-chat-session',
      ),
    ).toBe(!cleared)
  })
}
