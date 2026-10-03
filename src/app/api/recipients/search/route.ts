import { cookies } from 'next/headers'
import { AUTH_CONFIG, IS_PRODUCTION } from '@/features/auth/server'
import {
  hasSessionPassword,
  openSession,
  readCredentials,
} from '@/lib/auth/session'
import { checkAccount } from '@/lib/green-api/check-account'
import { handleSearchRequest } from '@/lib/recipients/handle-search-request'

const { COOKIE_NAME } = AUTH_CONFIG

export const POST = async (request: Request): Promise<Response> => {
  const store = await cookies()
  const password = process.env.SESSION_PASSWORD
  const configured = hasSessionPassword(password)
  const session = configured
    ? await openSession({ store, password, production: IS_PRODUCTION })
    : null
  const credentials = session && readCredentials({ session })

  return handleSearchRequest({
    request,
    context: { configured, credentials },
    lookup: checkAccount,
    clearSession: async () => void store.delete(COOKIE_NAME),
  })
}
