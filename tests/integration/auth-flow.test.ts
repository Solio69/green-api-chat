import { expect, test } from 'vitest'
import { resolveLogin } from '@/features/auth/application'
import type {
  InstanceCredentials,
  StateResult,
} from '@/lib/green-api/get-state'
import { EMPTY_STRING } from '@/lib/ui/constants'
import {
  CREDENTIALS,
  GREEN_API_CONTRACT,
  LOGIN_API_CONTRACT,
  TEST_REQUEST_FIXTURES,
} from '../constants'

const { ID, TOKEN } = CREDENTIALS
const credentials = { idInstance: ID, apiTokenInstance: TOKEN }
const validBody = JSON.stringify(credentials)
const { AUTHORIZED, NOT_AUTHORIZED, BLOCKED } = GREEN_API_CONTRACT
const {
  RESPONSE_OK,
  RESPONSE_ERROR,
  INVALID_REQUEST,
  INVALID_TOKEN,
  INVALID_INSTANCE,
  NEEDS_AUTHORIZATION,
  INSTANCE_RESTRICTED,
  INSTANCE_EXPIRED,
  RETRY_LATER,
  RATE_LIMITED,
  SERVICE_UNAVAILABLE,
  INVALID_UPSTREAM_RESPONSE,
  SERVER_UNAVAILABLE,
  OK_STATUS,
  INVALID_REQUEST_STATUS,
  UNAUTHORIZED_STATUS,
  CONFLICT_STATUS,
  BAD_GATEWAY_STATUS,
  UNAVAILABLE_STATUS,
  RATE_LIMIT_STATUS,
} = LOGIN_API_CONTRACT
const {
  BROKEN_JSON,
  ARRAY_JSON,
  EMPTY_OBJECT_JSON,
  WHITESPACE,
  OVERSIZE_FILL,
  EXTRA_BODY_LENGTH,
  NON_STRING_ID,
} = TEST_REQUEST_FIXTURES

const fixture = (state: StateResult) => {
  const calls: InstanceCredentials[] = []
  const saves: InstanceCredentials[] = []
  return {
    calls,
    saves,
    getState: async (value: InstanceCredentials) => {
      calls.push(value)
      return state
    },
    saveSession: async (value: InstanceCredentials) => void saves.push(value),
  }
}

test('auth-flow: authorized saves exact credentials and returns only ok', async () => {
  const { calls, saves, getState, saveSession } = fixture({
    kind: AUTHORIZED,
    body: { stateInstance: AUTHORIZED },
  })
  const result = await resolveLogin({
    rawBody: validBody,
    getState,
    saveSession,
  })
  expect(calls).toEqual([credentials])
  expect(saves).toEqual([credentials])
  expect(result).toEqual({ status: OK_STATUS, body: { status: RESPONSE_OK } })
  expect(JSON.stringify(result)).not.toContain(TOKEN)
})

for (const [index, rawBody] of [
  EMPTY_STRING,
  BROKEN_JSON,
  ARRAY_JSON,
  EMPTY_OBJECT_JSON,
  JSON.stringify({ idInstance: WHITESPACE, apiTokenInstance: TOKEN }),
  JSON.stringify({ idInstance: ID, apiTokenInstance: WHITESPACE }),
  JSON.stringify({ idInstance: NON_STRING_ID, apiTokenInstance: TOKEN }),
  JSON.stringify({ idInstance: ID, apiTokenInstance: false }),
  JSON.stringify({
    idInstance: ID,
    apiTokenInstance: TOKEN,
    huge: OVERSIZE_FILL.repeat(EXTRA_BODY_LENGTH),
  }),
].entries()) {
  test(`auth-flow: rejects invalid body case ${index} before provider`, async () => {
    const { calls, saves, getState, saveSession } = fixture({
      kind: AUTHORIZED,
      body: { stateInstance: AUTHORIZED },
    })
    const result = await resolveLogin({ rawBody, getState, saveSession })
    expect(result).toEqual({
      status: INVALID_REQUEST_STATUS,
      body: { status: RESPONSE_ERROR, code: INVALID_REQUEST },
    })
    expect(calls).toEqual([])
    expect(saves).toEqual([])
  })
}

for (const [state, status, code] of [
  [{ kind: INVALID_TOKEN }, UNAUTHORIZED_STATUS, INVALID_TOKEN],
  [{ kind: INVALID_INSTANCE }, UNAUTHORIZED_STATUS, INVALID_INSTANCE],
  [
    { kind: NEEDS_AUTHORIZATION, stateInstance: NOT_AUTHORIZED },
    CONFLICT_STATUS,
    NEEDS_AUTHORIZATION,
  ],
  [
    { kind: INSTANCE_RESTRICTED, stateInstance: BLOCKED },
    CONFLICT_STATUS,
    INSTANCE_RESTRICTED,
  ],
  [{ kind: INSTANCE_EXPIRED }, CONFLICT_STATUS, INSTANCE_EXPIRED],
  [{ kind: RETRY_LATER }, UNAVAILABLE_STATUS, RETRY_LATER],
  [{ kind: SERVICE_UNAVAILABLE }, UNAVAILABLE_STATUS, SERVICE_UNAVAILABLE],
  [
    { kind: INVALID_UPSTREAM_RESPONSE },
    BAD_GATEWAY_STATUS,
    INVALID_UPSTREAM_RESPONSE,
  ],
] as const) {
  test(`auth-flow: ${code} never saves a session`, async () => {
    const { saves, getState, saveSession } = fixture(state)
    const result = await resolveLogin({
      rawBody: validBody,
      getState,
      saveSession,
    })
    expect(result.status).toBe(status)
    expect(result.body.status).toBe(RESPONSE_ERROR)
    expect(result.body.code).toBe(code)
    expect(saves).toEqual([])
    expect(JSON.stringify(result)).not.toContain(TOKEN)
  })
}

test('auth-flow: session storage failure has a safe response', async () => {
  const { getState } = fixture({
    kind: AUTHORIZED,
    body: { stateInstance: AUTHORIZED },
  })
  const result = await resolveLogin({
    rawBody: validBody,
    getState,
    saveSession: async () => {
      throw new Error(TOKEN)
    },
  })
  expect(result).toEqual({
    status: UNAVAILABLE_STATUS,
    body: { status: RESPONSE_ERROR, code: SERVER_UNAVAILABLE },
  })
  expect(JSON.stringify(result)).not.toContain(TOKEN)
})

test('auth-flow: exhausted rate limit returns 429 and never saves a session', async () => {
  const { saves, getState, saveSession } = fixture({ kind: RATE_LIMITED })
  const result = await resolveLogin({
    rawBody: validBody,
    getState,
    saveSession,
  })
  expect(result).toEqual({
    status: RATE_LIMIT_STATUS,
    body: { status: RESPONSE_ERROR, code: RATE_LIMITED },
  })
  expect(saves).toEqual([])
})
