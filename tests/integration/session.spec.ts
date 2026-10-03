import { expect, test } from '@playwright/test'
import type { CookieStore } from 'iron-session'
import { openSession, readCredentials, saveCredentials } from '@/server/session'
import {
  CREDENTIALS,
  SESSION_CONTRACT,
  TEST_SESSION_FIXTURES,
} from '../constants'

const {
  PASSWORD: TEST_PASSWORD,
  SHORT_PASSWORD,
  ALTERED_COOKIE_OLD,
  ALTERED_COOKIE_NEW,
  BLANK_ID,
} = TEST_SESSION_FIXTURES
const { SAME_SITE, PATH, MAX_AGE } = SESSION_CONTRACT
const TEST_ERROR_MESSAGE = {
  MISSING_SESSION: 'Missing test session',
} as const
const { MISSING_SESSION } = TEST_ERROR_MESSAGE
const { ID: idInstance, TOKEN: apiTokenInstance } = CREDENTIALS
const credentials = { idInstance, apiTokenInstance }
const DAY_MS = 86_400_000
const START = 1_790_000_000_000

class MemoryStore implements CookieStore {
  values = new Map<string, string>()
  writes: Array<{
    name: string
    value: string
    options: Parameters<CookieStore['set']>[2]
  }> = []

  get(name: string) {
    const value = this.values.get(name)
    return value === undefined ? undefined : { name, value }
  }

  getAll() {
    return [...this.values].map(([name, value]) => ({ name, value }))
  }

  set(name: string, value: string, options: Parameters<CookieStore['set']>[2]) {
    this.writes.push({ name, value, options })
    this.values.set(name, value)
  }
}

const requireSession = async ({
  store,
  production = false,
}: {
  store: MemoryStore
  production?: boolean
}) => {
  const session = await openSession({
    store,
    password: TEST_PASSWORD,
    production,
  })
  if (!session) throw new Error(MISSING_SESSION)
  return session
}

test('session: cookie is encrypted, HttpOnly and scoped for production', async () => {
  const store = new MemoryStore()
  const session = await requireSession({ store, production: true })
  await saveCredentials({ session, credentials, now: START })
  expect(store.writes).toHaveLength(1)
  const [{ value, options }] = store.writes
  expect(value).not.toContain(idInstance)
  expect(value).not.toContain(apiTokenInstance)
  expect(options.httpOnly).toBe(true)
  expect(options.secure).toBe(true)
  expect(options.sameSite).toBe(SAME_SITE)
  expect(options.path).toBe(PATH)
  expect(options.maxAge).toBe(MAX_AGE)
  const restored = await requireSession({ store, production: true })
  expect(readCredentials({ session: restored, now: START + 1 })).toEqual(
    credentials,
  )
  expect(store.writes).toHaveLength(1)
})

test('session: local HTTP cookie is not Secure while retaining other protection', async () => {
  const store = new MemoryStore()
  const session = await requireSession({ store })
  await saveCredentials({ session, credentials, now: START })
  expect(store.writes[0].options.secure).toBe(false)
  expect(store.writes[0].options.httpOnly).toBe(true)
})

test('session: absolute 24-hour expiry is not extended by reading', async () => {
  const store = new MemoryStore()
  const session = await requireSession({ store })
  await saveCredentials({ session, credentials, now: START })
  expect(readCredentials({ session, now: START + DAY_MS - 1 })).toEqual(
    credentials,
  )
  expect(readCredentials({ session, now: START + DAY_MS })).toBeNull()
  expect(store.writes).toHaveLength(1)
})

test('session: missing and malformed payload do not grant access', async () => {
  const store = new MemoryStore()
  const session = await requireSession({ store })
  expect(readCredentials({ session, now: START })).toBeNull()
  session.idInstance = BLANK_ID
  session.apiTokenInstance = apiTokenInstance
  session.expiresAt = START + DAY_MS
  expect(readCredentials({ session, now: START })).toBeNull()
  session.idInstance = idInstance
  session.expiresAt = Number.POSITIVE_INFINITY
  expect(readCredentials({ session, now: START })).toBeNull()
})

test('session: modified cookie cannot be read', async () => {
  const store = new MemoryStore()
  const session = await requireSession({ store })
  await saveCredentials({ session, credentials, now: START })
  const [cookie] = store.writes
  const index = Math.floor(cookie.value.length / 2)
  const replacement =
    cookie.value[index] === ALTERED_COOKIE_OLD
      ? ALTERED_COOKIE_NEW
      : ALTERED_COOKIE_OLD
  store.values.set(
    cookie.name,
    `${cookie.value.slice(0, index)}${replacement}${cookie.value.slice(index + 1)}`,
  )
  const restored = await requireSession({ store })
  expect(readCredentials({ session: restored, now: START })).toBeNull()
})

test('session: missing or short secret is unavailable', async () => {
  const store = new MemoryStore()
  expect(
    await openSession({ store, password: undefined, production: false }),
  ).toBeNull()
  expect(
    await openSession({ store, password: SHORT_PASSWORD, production: false }),
  ).toBeNull()
  expect(store.writes).toHaveLength(0)
})
