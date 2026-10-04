import { createHmac } from 'node:crypto'
import { CHAT_SCOPE_CONFIG } from '@/features/chats/model'

const {
  DOMAIN: SCOPE_DOMAIN,
  ALGORITHM: SCOPE_ALGORITHM,
  ENCODING: SCOPE_ENCODING,
} = CHAT_SCOPE_CONFIG
// Server import graph: this binding never replaces the HttpOnly cookie.
export const getQueryScope = ({
  session,
  password,
}: {
  session: {
    idInstance?: string
    apiTokenInstance?: string
    expiresAt?: number
  }
  password: string
}): string =>
  createHmac(SCOPE_ALGORITHM, password)
    .update(
      JSON.stringify([
        SCOPE_DOMAIN,
        session.idInstance,
        session.apiTokenInstance,
        session.expiresAt,
      ]),
    )
    .digest(SCOPE_ENCODING)
