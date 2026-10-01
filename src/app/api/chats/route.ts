import { cookies } from 'next/headers'
import { getQueryScope } from '@/lib/auth/get-query-scope'
import {
  hasSessionPassword,
  openSession,
  readCredentials,
} from '@/lib/auth/session'
import { handleChatsRequest } from '@/lib/chats/handle-chats-request'
import { getChats } from '@/lib/green-api/get-chats'
import { AUTH_CONFIG, IS_PRODUCTION } from '@/lib/auth/constants'

const { COOKIE_NAME } = AUTH_CONFIG
export const GET = async (request: Request): Promise<Response> => {
  const store = await cookies()
  const password = process.env.SESSION_PASSWORD
  const configured = hasSessionPassword(password)
  const session = await openSession(store, password, IS_PRODUCTION)
  const credentials = session && readCredentials(session)
  const canBind = configured && session !== null && credentials !== null
  const connectionScope = canBind ? getQueryScope({ session, password }) : null
  return handleChatsRequest({
    request,
    context: { configured, credentials, connectionScope },
    lookup: getChats,
    clearSession: async () => {
      store.delete(COOKIE_NAME)
    },
  })
}
