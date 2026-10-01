import { expect, test } from '@playwright/test'
import { GET as endSession } from '@/app/api/auth/end-session/route'
import { resolveHome } from '@/lib/auth/resolve-home'
import type { StateResult } from '@/lib/green-api/get-state'
import { EMPTY_STRING } from '@/lib/ui/constants'
import {
  CREDENTIALS,
  GREEN_API_CONTRACT,
  HOME_CONTRACT,
  LOGIN_API_CONTRACT,
  SESSION_CONTRACT,
} from '../constants'

const { ID, TOKEN } = CREDENTIALS
const credentials = { idInstance: ID, apiTokenInstance: TOKEN }
const { AUTHORIZED, NOT_AUTHORIZED, BLOCKED } = GREEN_API_CONTRACT
const {
  LOGIN,
  END_SESSION,
  RETRY,
  ACCESS_LOST_REDIRECT,
  END_SESSION_UNTRUSTED_URL,
  REDIRECT_STATUS,
  LOCATION_HEADER,
  SET_COOKIE_HEADER,
} = HOME_CONTRACT
const {
  INVALID_TOKEN,
  INVALID_INSTANCE,
  NEEDS_AUTHORIZATION,
  INSTANCE_RESTRICTED,
  INSTANCE_EXPIRED,
  RETRY_LATER,
  SERVICE_UNAVAILABLE,
  INVALID_UPSTREAM_RESPONSE,
  RATE_LIMITED,
} = LOGIN_API_CONTRACT
const { COOKIE_NAME, EXPIRED_COOKIE_PATTERN } = SESSION_CONTRACT

test('home-flow: missing session never calls GREEN-API', async () => {
  let calls = 0
  const result = await resolveHome(null, async () => {
    calls += 1
    return { kind: AUTHORIZED, body: { stateInstance: AUTHORIZED } }
  })
  expect(result).toEqual({ kind: LOGIN })
  expect(calls).toBe(0)
})

test('home-flow: authorized rechecks and renders only documented JSON', async () => {
  let calls = 0
  const getState = async () => {
    calls += 1
    return {
      kind: AUTHORIZED,
      body: { stateInstance: AUTHORIZED },
    } as const
  }
  expect(await resolveHome(credentials, getState)).toEqual({
    kind: AUTHORIZED,
    body: { stateInstance: AUTHORIZED },
  })
  expect(await resolveHome(credentials, getState)).toEqual({
    kind: AUTHORIZED,
    body: { stateInstance: AUTHORIZED },
  })
  expect(calls).toBe(2)
})

for (const kind of [
  INVALID_TOKEN,
  INVALID_INSTANCE,
  NEEDS_AUTHORIZATION,
  INSTANCE_RESTRICTED,
  INSTANCE_EXPIRED,
] as const) {
  test(`home-flow: ${kind} ends the session`, async () => {
    const state: StateResult =
      kind === NEEDS_AUTHORIZATION
        ? { kind, stateInstance: NOT_AUTHORIZED }
        : kind === INSTANCE_RESTRICTED
          ? { kind, stateInstance: BLOCKED }
          : { kind }
    expect(await resolveHome(credentials, async () => state)).toEqual({
      kind: END_SESSION,
    })
  })
}

for (const kind of [
  RETRY_LATER,
  SERVICE_UNAVAILABLE,
  INVALID_UPSTREAM_RESPONSE,
] as const) {
  test(`home-flow: ${kind} preserves the session for retry`, async () => {
    expect(await resolveHome(credentials, async () => ({ kind }))).toEqual({
      kind: RETRY,
    })
  })
}

test('home-flow: thrown provider error preserves the session', async () => {
  expect(
    await resolveHome(credentials, async () => {
      throw new Error(TOKEN)
    }),
  ).toEqual({ kind: RETRY })
})

test('home-flow: end-session deletes only the app cookie and fixes redirect', async () => {
  const response = endSession(new Request(END_SESSION_UNTRUSTED_URL))
  expect(response.status).toBe(REDIRECT_STATUS)
  expect(response.headers.get(LOCATION_HEADER)).toBe(ACCESS_LOST_REDIRECT)
  const cookie = response.headers.get(SET_COOKIE_HEADER) ?? EMPTY_STRING
  expect(cookie).toContain(`${COOKIE_NAME}=`)
  expect(cookie).toMatch(EXPIRED_COOKIE_PATTERN)
  expect(cookie).not.toContain(TOKEN)
})

test('home-flow: rate limit preserves the existing session for manual retry', async () => {
  expect(
    await resolveHome(credentials, async () => ({ kind: RATE_LIMITED })),
  ).toEqual({ kind: RETRY })
})
