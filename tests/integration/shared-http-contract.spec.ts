import { expect, test } from '@playwright/test'
import { handleLoginRequest } from '@/features/auth/server'
import { handleChatsRequest } from '@/features/chats/server'
import { handleSearchRequest } from '@/features/recipients/server'
import { handleHistoryRequest } from '@/lib/history/handle-history-request'
import { handleNotificationRequest } from '@/lib/notifications/handle-notification-request'
import { handleSendRequest } from '@/lib/sending/handle-send-request'
import { HISTORY_TEST } from '../history/constants'

const { credentials, scopeA } = HISTORY_TEST
const ORIGIN = 'https://app.example.test'
const FOREIGN = 'https://foreign.example.test'
const PASSWORD = 'fictional-password-for-http-contract-tests'
const noClear = async () => undefined
const jsonRequest = ({
  path,
  origin = ORIGIN,
  scope = scopeA,
  contentType = 'application/json',
}: {
  path: string
  origin?: string | null
  scope?: string | null
  contentType?: string | null
}) => {
  const headers = new Headers()
  if (origin !== null) headers.set('Origin', origin)
  if (scope !== null) headers.set('X-Connection-Scope', scope)
  if (contentType !== null) headers.set('Content-Type', contentType)
  return new Request(`${ORIGIN}${path}`, {
    method: 'POST',
    headers,
    body: '{}',
  })
}

const expectError = async ({
  response,
  status,
  code,
  outcome,
}: {
  response: Response
  status: number
  code: string
  outcome?: string
}) => {
  expect(response.status).toBe(status)
  expect(response.headers.get('Cache-Control')).toBe('no-store')
  const body = await response.json()
  expect(body).toEqual({
    status: 'error',
    code,
    ...(outcome && { outcome }),
  })
}

test('send preserves Origin refusal and not_sent before provider dispatch', async () => {
  let calls = 0
  const response = await handleSendRequest({
    request: jsonRequest({ path: '/api/messages', origin: FOREIGN }),
    context: { configured: true, credentials, connectionScope: scopeA },
    send: async () => {
      calls += 1
      return { kind: 'ok', idMessage: 'fictional-message' }
    },
    clearSession: noClear,
  })
  await expectError({
    response,
    status: 403,
    code: 'invalid_request',
    outcome: 'not_sent',
  })
  expect(calls).toBe(0)
})

test('history preserves scope-before-Origin refusal and no provider call', async () => {
  let calls = 0
  const response = await handleHistoryRequest({
    request: jsonRequest({ path: '/api/chats/history', origin: FOREIGN }),
    context: { configured: true, credentials, connectionScope: scopeA },
    lookup: async () => {
      calls += 1
      return { kind: 'ok', messages: [] }
    },
    clearSession: noClear,
  })
  await expectError({ response, status: 403, code: 'invalid_request' })
  expect(calls).toBe(0)
})

test('history keeps invalid scope ahead of foreign Origin', async () => {
  let calls = 0
  const response = await handleHistoryRequest({
    request: jsonRequest({
      path: '/api/chats/history',
      origin: FOREIGN,
      scope: 'invalid',
    }),
    context: { configured: true, credentials, connectionScope: scopeA },
    lookup: async () => {
      calls += 1
      return { kind: 'ok', messages: [] }
    },
    clearSession: noClear,
  })
  await expectError({ response, status: 400, code: 'invalid_request' })
  expect(calls).toBe(0)
})

test('history still accepts a large JSON body without Content-Type or byte limit', async () => {
  let calls = 0
  const response = await handleHistoryRequest({
    request: new Request(`${ORIGIN}/api/chats/history`, {
      method: 'POST',
      headers: { Origin: ORIGIN, 'X-Connection-Scope': scopeA },
      body: JSON.stringify({ chatId: HISTORY_TEST.chatA }) + ' '.repeat(70_000),
    }),
    context: { configured: true, credentials, connectionScope: scopeA },
    lookup: async () => {
      calls += 1
      return { kind: 'ok', messages: [] }
    },
    clearSession: noClear,
  })
  expect(response.status).toBe(200)
  expect(response.headers.get('Cache-Control')).toBe('no-store')
  expect(calls).toBe(1)
})
test('notifications preserve Origin refusal before session and body', async () => {
  let calls = 0
  const response = await handleNotificationRequest({
    request: jsonRequest({
      path: '/api/notifications/settings',
      origin: FOREIGN,
    }),
    action: 'settings',
    context: null,
    configured: true,
    password: PASSWORD,
    clearSession: noClear,
    provider: {
      settings: async () => {
        calls += 1
        return { outgoingEnabled: false }
      },
      receive: async () => null,
      delete: async () => true,
    },
  })
  await expectError({ response, status: 403, code: 'invalid_request' })
  expect(calls).toBe(0)
})

test('chats preserves invalid scope response before provider', async () => {
  let calls = 0
  const response = await handleChatsRequest({
    request: new Request(`${ORIGIN}/api/chats`, {
      headers: { 'X-Connection-Scope': 'invalid' },
    }),
    context: { configured: true, credentials, connectionScope: scopeA },
    lookup: async () => {
      calls += 1
      return { kind: 'ok', chats: [] }
    },
    clearSession: noClear,
  })
  await expectError({ response, status: 400, code: 'invalid_request' })
  expect(calls).toBe(0)
})

test('recipient search preserves media-type refusal before provider call', async () => {
  let calls = 0
  const response = await handleSearchRequest({
    request: jsonRequest({
      path: '/api/recipients/search',
      contentType: 'text/plain',
    }),
    context: { configured: true, credentials },
    lookup: async () => {
      calls += 1
      return { kind: 'not_found' }
    },
    clearSession: noClear,
  })
  await expectError({ response, status: 400, code: 'invalid_request' })
  expect(calls).toBe(0)
})

test('login preserves media-type refusal before provider or cookie write', async () => {
  let calls = 0
  const response = await handleLoginRequest({
    request: jsonRequest({
      path: '/api/auth/login',
      contentType: 'text/plain',
    }),
    getState: async () => {
      calls += 1
      return { kind: 'authorized', body: { stateInstance: 'authorized' } }
    },
    saveSession: async () => {
      calls += 1
    },
  })
  await expectError({ response, status: 400, code: 'invalid_request' })
  expect(calls).toBe(0)
})
