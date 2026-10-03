import { sendMessage } from '@/lib/green-api/send-message'
import { handleSendRequest } from '@/lib/sending/handle-send-request'
import { readRouteSession } from '@/server/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 20
export const POST = async (request: Request): Promise<Response> => {
  const { configured, context, clearSession } = await readRouteSession()
  return handleSendRequest({
    request,
    context: {
      configured,
      credentials: context?.credentials ?? null,
      connectionScope: context?.connectionScope ?? null,
    },
    send: sendMessage,
    clearSession,
  })
}
