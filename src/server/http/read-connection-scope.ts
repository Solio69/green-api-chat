import { CHAT_SCOPE_CONFIG } from '@/features/chats/model'
import { HTTP_HEADERS } from '@/lib/http/constants'

const { PATTERN: SCOPE_PATTERN } = CHAT_SCOPE_CONFIG
const { CONNECTION_SCOPE } = HTTP_HEADERS

export const readConnectionScope = (request: Request): string | null => {
  const scope = request.headers.get(CONNECTION_SCOPE)
  return scope !== null && SCOPE_PATTERN.test(scope) ? scope : null
}
