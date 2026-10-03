import { cookies } from 'next/headers'
import { readRequestSession } from './read-request-session'
import { AUTH_CONFIG, IS_PRODUCTION } from '@/features/auth/server'

const { COOKIE_NAME } = AUTH_CONFIG

export const readRouteSession = async () => {
  const store = await cookies()
  const result = await readRequestSession({
    store,
    password: process.env.SESSION_PASSWORD,
    production: IS_PRODUCTION,
  })
  const clearSession = async () => {
    store.delete(COOKIE_NAME)
  }
  return { ...result, clearSession }
}
