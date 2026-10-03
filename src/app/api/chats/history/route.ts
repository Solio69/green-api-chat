import { getChatHistory } from '@/lib/green-api/get-chat-history'
import { handleHistoryRequest } from '@/lib/history/handle-history-request'
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
