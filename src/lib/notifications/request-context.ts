import { cookies } from 'next/headers'
import { getQueryScope } from '@/lib/auth/get-query-scope'
import {
  hasSessionPassword,
  openSession,
  readCredentials,
} from '@/lib/auth/session'
import { AUTH_CONFIG, IS_PRODUCTION } from '@/lib/auth/constants'

const { COOKIE_NAME: AUTH_CONFIG_COOKIE_NAME } = AUTH_CONFIG

export const readNotificationContext = async () => {
  const store = await cookies()
  const password = process.env.SESSION_PASSWORD
  const configured = hasSessionPassword(password)
  const session = await openSession({
    store,
    password,
    production: IS_PRODUCTION,
  })
  const credentials = session && readCredentials({ session })
  const expiresAt = session?.expiresAt
  const valid =
    configured &&
    session !== null &&
    credentials !== null &&
    typeof expiresAt === 'number'
  const context = valid
    ? {
        credentials,
        connectionScope: getQueryScope({ session, password }),
        expiresAt,
      }
    : null
  const clearSession = async () => {
    store.delete(AUTH_CONFIG_COOKIE_NAME)
  }
  return { context, configured, clearSession }
}
