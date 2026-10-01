import { cookies } from 'next/headers'
import {
  hasSessionPassword,
  openSession,
  readCredentials,
} from '@/lib/auth/session'
import { checkAccount } from '@/lib/green-api/check-account'
import { handleSearchRequest } from '@/lib/recipients/handle-search-request'
import { AUTH_CONFIG, IS_PRODUCTION } from '@/lib/auth/constants'

const { COOKIE_NAME } = AUTH_CONFIG

export const POST = async (request: Request): Promise<Response> => {
  const store = await cookies()
  const password = process.env.SESSION_PASSWORD
  const configured = hasSessionPassword(password)
  const session = configured
    ? await openSession(store, password, IS_PRODUCTION)
    : null
  const credentials = session && readCredentials(session)

  return handleSearchRequest(
    request,
    { configured, credentials },
    checkAccount,
    async () => void store.delete(COOKIE_NAME),
  )
}
