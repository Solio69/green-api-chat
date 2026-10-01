import {
  getIronSession,
  type CookieStore,
  type IronSession,
  type SessionOptions,
} from 'iron-session'
import type { InstanceCredentials } from '@/lib/green-api/get-state'
import { AUTH_CONFIG } from './constants'

const {
  COOKIE_NAME,
  COOKIE_SAME_SITE,
  COOKIE_PATH,
  PASSWORD_MIN_LENGTH,
  SESSION_DURATION_SECONDS,
} = AUTH_CONFIG
const SESSION_DURATION_MS = SESSION_DURATION_SECONDS * 1_000

export type SessionPayload = InstanceCredentials & { expiresAt: number }

export const hasSessionPassword = (
  password: string | undefined,
): password is string =>
  typeof password === 'string' && password.length >= PASSWORD_MIN_LENGTH

const sessionOptions = (
  password: string,
  production: boolean,
): SessionOptions => ({
  password,
  cookieName: COOKIE_NAME,
  ttl: SESSION_DURATION_SECONDS,
  cookieOptions: {
    httpOnly: true,
    secure: production,
    sameSite: COOKIE_SAME_SITE,
    path: COOKIE_PATH,
    maxAge: SESSION_DURATION_SECONDS,
  },
})

export const openSession = async (
  store: CookieStore,
  password: string | undefined,
  production: boolean,
): Promise<IronSession<SessionPayload> | null> => {
  if (!hasSessionPassword(password)) return null
  try {
    return await getIronSession<SessionPayload>(
      store,
      sessionOptions(password, production),
    )
  } catch {
    return null
  }
}

export const saveCredentials = async (
  session: IronSession<SessionPayload>,
  credentials: InstanceCredentials,
  now = Date.now(),
): Promise<void> => {
  session.idInstance = credentials.idInstance
  session.apiTokenInstance = credentials.apiTokenInstance
  session.expiresAt = now + SESSION_DURATION_MS
  await session.save()
}

export const readCredentials = (
  session: IronSession<SessionPayload>,
  now = Date.now(),
): InstanceCredentials | null => {
  const { idInstance, apiTokenInstance, expiresAt } = session
  if (
    typeof idInstance !== 'string' ||
    typeof apiTokenInstance !== 'string' ||
    idInstance.trim().length === 0 ||
    apiTokenInstance.trim().length === 0 ||
    typeof expiresAt !== 'number' ||
    !Number.isFinite(expiresAt) ||
    expiresAt <= now
  )
    return null
  return { idInstance, apiTokenInstance }
}
