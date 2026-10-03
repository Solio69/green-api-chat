import { createHmac } from 'node:crypto'
import type { CookieStore } from 'iron-session'
import { describe, expect, it } from 'vitest'
import {
  openSession,
  readRequestSession,
  saveCredentials,
} from '@/server/session'
import { CREDENTIALS, TEST_SESSION_FIXTURES } from '../constants'

const { PASSWORD, SHORT_PASSWORD } = TEST_SESSION_FIXTURES
const { ID: idInstance, TOKEN: apiTokenInstance } = CREDENTIALS
const NOW = 1_790_000_000_000
const DAY_MS = 86_400_000
const credentials = { idInstance, apiTokenInstance }

class MemoryStore implements CookieStore {
  values = new Map<string, string>()
  writes = 0

  get(name: string) {
    const value = this.values.get(name)
    return value === undefined ? undefined : { name, value }
  }

  getAll() {
    return [...this.values].map(([name, value]) => ({ name, value }))
  }

  set(name: string, value: string) {
    this.writes += 1
    this.values.set(name, value)
  }
}

const createSession = async ({
  store,
  value = credentials,
  savedAt = NOW,
}: {
  store: MemoryStore
  value?: { idInstance: string; apiTokenInstance: string }
  savedAt?: number
}) => {
  const session = await openSession({
    store,
    password: PASSWORD,
    production: false,
  })
  if (!session) throw new Error('Missing test session')
  await saveCredentials({ session, credentials: value, now: savedAt })
}

describe('server session context', () => {
  it('distinguishes missing configuration without writing cookies', async () => {
    const store = new MemoryStore()
    const missing = await readRequestSession({
      store,
      password: undefined,
      production: false,
      now: NOW,
    })
    const short = await readRequestSession({
      store,
      password: SHORT_PASSWORD,
      production: false,
      now: NOW,
    })
    expect(missing).toEqual({
      kind: 'unconfigured',
      configured: false,
      context: null,
    })
    expect(short).toEqual({
      kind: 'unconfigured',
      configured: false,
      context: null,
    })
    expect(store.writes).toBe(0)
  })

  it('returns missing for absent, damaged and expired cookies', async () => {
    const empty = new MemoryStore()
    expect(
      await readRequestSession({
        store: empty,
        password: PASSWORD,
        production: false,
        now: NOW,
      }),
    ).toEqual({ kind: 'missing', configured: true, context: null })

    const damaged = new MemoryStore()
    await createSession({ store: damaged })
    const [name, cookie] = [...damaged.values][0]
    const midpoint = Math.floor(cookie.length / 2)
    const changed = cookie[midpoint] === 'A' ? 'B' : 'A'
    damaged.values.set(
      name,
      `${cookie.slice(0, midpoint)}${changed}${cookie.slice(midpoint + 1)}`,
    )
    const writesAfterSetup = damaged.writes
    expect(
      await readRequestSession({
        store: damaged,
        password: PASSWORD,
        production: false,
        now: NOW,
      }),
    ).toEqual({ kind: 'missing', configured: true, context: null })
    expect(damaged.writes).toBe(writesAfterSetup)

    const expired = new MemoryStore()
    await createSession({ store: expired, savedAt: NOW - DAY_MS })
    const writesBeforeRead = expired.writes
    expect(
      await readRequestSession({
        store: expired,
        password: PASSWORD,
        production: false,
        now: NOW,
      }),
    ).toEqual({ kind: 'missing', configured: true, context: null })
    expect(expired.writes).toBe(writesBeforeRead)
  })

  it('returns bound scope and expiry without returning the password or refreshing cookie', async () => {
    const store = new MemoryStore()
    await createSession({ store })
    const writesBeforeRead = store.writes
    const result = await readRequestSession({
      store,
      password: PASSWORD,
      production: false,
      now: NOW + 1,
    })
    const expectedScope = createHmac('sha256', PASSWORD)
      .update(
        JSON.stringify([
          'chat-query-v1',
          idInstance,
          apiTokenInstance,
          NOW + DAY_MS,
        ]),
      )
      .digest('base64url')
    expect(result).toEqual({
      kind: 'authorized',
      configured: true,
      context: {
        credentials,
        connectionScope: expectedScope,
        expiresAt: NOW + DAY_MS,
      },
    })
    expect(JSON.stringify(result)).not.toContain(PASSWORD)
    expect(store.writes).toBe(writesBeforeRead)
  })

  it('isolates two requests with different stores and credentials', async () => {
    const first = new MemoryStore()
    const second = new MemoryStore()
    await createSession({ store: first })
    const other = { idInstance: `${idInstance}-other`, apiTokenInstance }
    await createSession({ store: second, value: other })
    const [a, b] = await Promise.all([
      readRequestSession({
        store: first,
        password: PASSWORD,
        production: false,
        now: NOW + 1,
      }),
      readRequestSession({
        store: second,
        password: PASSWORD,
        production: false,
        now: NOW + 1,
      }),
    ])
    expect(a.kind).toBe('authorized')
    expect(b.kind).toBe('authorized')
    expect(a.context?.credentials).toEqual(credentials)
    expect(b.context?.credentials).toEqual(other)
    expect(a.context?.connectionScope).not.toBe(b.context?.connectionScope)
  })
})
