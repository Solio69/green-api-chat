import { cookies } from 'next/headers'
import { AUTH_ERROR_MESSAGE, IS_PRODUCTION } from '@/lib/auth/constants'
import { handleLoginRequest } from '@/lib/auth/handle-login-request'
import { openSession, saveCredentials } from '@/lib/auth/session'
import { getStateInstance } from '@/lib/green-api/get-state'
import type { InstanceCredentials } from '@/lib/green-api/get-state'

const { SESSION_UNAVAILABLE } = AUTH_ERROR_MESSAGE

export const POST = async (request: Request): Promise<Response> =>
  handleLoginRequest(
    request,
    getStateInstance,
    async (credentials: InstanceCredentials) => {
      const session = await openSession(
        await cookies(),
        process.env.SESSION_PASSWORD,
        IS_PRODUCTION,
      )
      if (!session) throw new Error(SESSION_UNAVAILABLE)
      await saveCredentials(session, credentials)
    },
  )
