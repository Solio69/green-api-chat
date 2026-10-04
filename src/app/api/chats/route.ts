import { handleChatsRequest, getChats } from '@/features/chats/server'
import { readRouteSession } from '@/server/session'

export const GET = async (request: Request): Promise<Response> => {
  const { configured, context, clearSession } = await readRouteSession()
  return handleChatsRequest({
    request,
    context: {
      configured,
      credentials: context?.credentials ?? null,
      connectionScope: context?.connectionScope ?? null,
    },
    lookup: getChats,
    clearSession,
  })
}
