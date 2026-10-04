import type { CookieStore } from 'iron-session'
import { getQueryScope } from './get-query-scope'
import {
  hasSessionPassword,
  openSession,
  readCredentials,
} from './iron-session'
import type { SessionReadResult } from './types'

export const readRequestSession = async ({
  store,
  password,
  production,
  now = Date.now(),
}: {
  store: CookieStore
  password: string | undefined
  production: boolean
  now?: number
}): Promise<SessionReadResult> => {
  if (!hasSessionPassword(password))
    return { kind: 'unconfigured', configured: false, context: null }
  const session = await openSession({ store, password, production })
  const credentials = session && readCredentials({ session, now })
  const expiresAt = session?.expiresAt
  if (!session || !credentials || typeof expiresAt !== 'number')
    return { kind: 'missing', configured: true, context: null }
  return {
    kind: 'authorized',
    configured: true,
    context: {
      credentials,
      connectionScope: getQueryScope({ session, password }),
      expiresAt,
    },
  }
}
