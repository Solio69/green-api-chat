import { CHAT_QUERY_CONFIG } from '@/lib/chats/constants'
import { HTTP_HEADERS } from '@/lib/http/constants'

const { SCOPE_PATTERN } = CHAT_QUERY_CONFIG
const { CONNECTION_SCOPE } = HTTP_HEADERS

export const readConnectionScope = (request: Request): string | null => {
  const scope = request.headers.get(CONNECTION_SCOPE)
  return scope !== null && SCOPE_PATTERN.test(scope) ? scope : null
}
