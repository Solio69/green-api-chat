import { handleHistoryRequest } from '@/features/conversation/history/server/handle-history-request'
import { getChatHistory } from '@/server/green-api/get-chat-history'
import { readRouteSession } from '@/server/session'

export const runtime = 'nodejs'
export const POST = async (request: Request): Promise<Response> => {
  const { configured, context, clearSession } = await readRouteSession()
  return handleHistoryRequest({
    request,
    context: {
      configured,
      credentials: context?.credentials ?? null,
      connectionScope: context?.connectionScope ?? null,
    },
    lookup: getChatHistory,
    clearSession,
  })
}
