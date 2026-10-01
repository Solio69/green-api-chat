import { createHmac } from 'node:crypto'
import type { SessionPayload } from './session'
import { CHAT_QUERY_CONFIG } from '@/lib/chats/constants'

const { SCOPE_DOMAIN, SCOPE_ALGORITHM, SCOPE_ENCODING } = CHAT_QUERY_CONFIG
// Server import graph: this binding never replaces the HttpOnly cookie.
export const getQueryScope = ({
  session,
  password,
}: {
  session: Partial<SessionPayload>
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
