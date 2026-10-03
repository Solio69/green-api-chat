import { cookies } from 'next/headers'
import {
  AUTH_ERROR_MESSAGE,
  handleLoginRequest,
  IS_PRODUCTION,
} from '@/features/auth/server'
import { openSession, saveCredentials } from '@/lib/auth/session'
import { getStateInstance } from '@/lib/green-api/get-state'
import type { InstanceCredentials } from '@/lib/green-api/get-state'

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
