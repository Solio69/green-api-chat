import { cookies } from 'next/headers'
import { handleLoginRequest } from '@/features/auth/server'
import { getStateInstance } from '@/server/green-api/get-state'
import { openSession, saveCredentials } from '@/server/session'
import type { InstanceCredentials } from '@/shared/kernel/api/instance-credentials'
import { AUTH_ERROR_MESSAGE, IS_PRODUCTION } from '@/server/session/constants'

const { SESSION_UNAVAILABLE } = AUTH_ERROR_MESSAGE

export const POST = async (request: Request): Promise<Response> =>
  handleLoginRequest({
    request,
    getState: (credentials) => getStateInstance({ credentials }),
    saveSession: async (credentials: InstanceCredentials) => {
      const session = await openSession({
        store: await cookies(),
        password: process.env.SESSION_PASSWORD,
        production: IS_PRODUCTION,
      })
      if (!session) throw new Error(SESSION_UNAVAILABLE)
      await saveCredentials({ session, credentials })
    },
  })
