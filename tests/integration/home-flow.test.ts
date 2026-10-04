import { expect, test } from 'vitest'
import { GET as endSession } from '@/app/api/auth/end-session/route'
import type { AccountSettingsResult } from '@/features/account/model'
import { resolveHome } from '@/features/auth/application'
import { EMPTY_STRING } from '@/shared/kernel/ui/constants'
import {
  CREDENTIALS,
  ACCOUNT_CONTRACT,
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
const { PROFILE } = ACCOUNT_CONTRACT

test('home-flow: passes only the prepared profile from the account loader', async () => {
  const body = { stateInstance: AUTHORIZED, profile: PROFILE } as const
  expect(
    await resolveHome({
      credentials,
      getAccountSettings: async () => ({ kind: AUTHORIZED, body }),
    }),
  ).toEqual({ kind: AUTHORIZED, body })
})

test('home-flow: missing session never calls GREEN-API', async () => {
  let calls = 0
  const result = await resolveHome({
    credentials: null,
    getAccountSettings: async () => {
      calls += 1
      return {
        kind: AUTHORIZED,
        body: { stateInstance: AUTHORIZED, profile: PROFILE },
      }
    },
  })
  expect(result).toEqual({ kind: LOGIN })
  expect(calls).toBe(0)
})

test('home-flow: authorized rechecks and returns state for home', async () => {
  let calls = 0
  const getAccountSettings = async () => {
    calls += 1
    return {
      kind: AUTHORIZED,
      body: { stateInstance: AUTHORIZED, profile: PROFILE },
    } as const
  }
  expect(await resolveHome({ credentials, getAccountSettings })).toEqual({
    kind: AUTHORIZED,
    body: { stateInstance: AUTHORIZED, profile: PROFILE },
  })
  expect(await resolveHome({ credentials, getAccountSettings })).toEqual({
    kind: AUTHORIZED,
    body: { stateInstance: AUTHORIZED, profile: PROFILE },
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
    let state: AccountSettingsResult

    if (kind === NEEDS_AUTHORIZATION) {
      state = { kind, stateInstance: NOT_AUTHORIZED }
    } else if (kind === INSTANCE_RESTRICTED) {
      state = { kind, stateInstance: BLOCKED }
    } else {
      state = { kind }
    }

    expect(
      await resolveHome({ credentials, getAccountSettings: async () => state }),
    ).toEqual({
      kind: END_SESSION,
    })
  })
}

for (const kind of [
  RETRY_LATER,
  SERVICE_UNAVAILABLE,
  INVALID_UPSTREAM_RESPONSE,
] as const) {
  test(`home-flow: ${kind} preserves the session for retry`, async () =>
    expect(
      await resolveHome({
        credentials,
        getAccountSettings: async () => ({ kind }),
      }),
    ).toEqual({
      kind: RETRY,
    }))
}

test('home-flow: thrown provider error preserves the session', async () =>
  expect(
    await resolveHome({
      credentials,
      getAccountSettings: async () => {
        throw new Error(TOKEN)
      },
    }),
  ).toEqual({ kind: RETRY }))

test('home-flow: end-session deletes only the app cookie and fixes redirect', async () => {
  const response = endSession(new Request(END_SESSION_UNTRUSTED_URL))
  expect(response.status).toBe(REDIRECT_STATUS)
  expect(response.headers.get(LOCATION_HEADER)).toBe(ACCESS_LOST_REDIRECT)
  const cookie = response.headers.get(SET_COOKIE_HEADER) ?? EMPTY_STRING
  expect(cookie).toContain(`${COOKIE_NAME}=`)
  expect(cookie).toMatch(EXPIRED_COOKIE_PATTERN)
  expect(cookie).not.toContain(TOKEN)
})

test('home-flow: rate limit preserves the existing session for manual retry', async () =>
  expect(
    await resolveHome({
      credentials,
      getAccountSettings: async () => ({ kind: RATE_LIMITED }),
    }),
  ).toEqual({ kind: RETRY }))
