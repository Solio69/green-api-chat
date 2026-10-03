import { handleChatsRequest } from '@/lib/chats/handle-chats-request'
import { getChats } from '@/lib/green-api/get-chats'
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
