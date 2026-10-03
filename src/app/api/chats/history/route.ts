import { cookies } from 'next/headers'
import {
  AUTH_CONFIG,
  getQueryScope,
  IS_PRODUCTION,
} from '@/features/auth/server'
import {
  hasSessionPassword,
  openSession,
  readCredentials,
} from '@/lib/auth/session'
import { getChatHistory } from '@/lib/green-api/get-chat-history'
import { handleHistoryRequest } from '@/lib/history/handle-history-request'

const { COOKIE_NAME } = AUTH_CONFIG

export const runtime = 'nodejs'
export const POST = async (request: Request): Promise<Response> => {
  const store = await cookies()
  const password = process.env.SESSION_PASSWORD
  const configured = hasSessionPassword(password)
  const session = await openSession({
    store,
    password,
    production: IS_PRODUCTION,
  })
  const credentials = session && readCredentials({ session })
  const canBind = configured && session !== null && credentials !== null
  const connectionScope = canBind ? getQueryScope({ session, password }) : null
  return handleHistoryRequest({
    request,
    context: { configured, credentials, connectionScope },
    lookup: getChatHistory,
    clearSession: async () => {
      store.delete(COOKIE_NAME)
    },
  })
}
