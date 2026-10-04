import { cookies } from 'next/headers'
import { readRequestSession } from './read-request-session'
import { IS_PRODUCTION } from './constants'

export const readPageSession = async () =>
  readRequestSession({
    store: await cookies(),
    password: process.env.SESSION_PASSWORD,
    production: IS_PRODUCTION,
  })
