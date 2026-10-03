import { sendMessage } from '@/lib/green-api/send-message'
import { readNotificationContext } from '@/lib/notifications/request-context'
import { handleSendRequest } from '@/lib/sending/handle-send-request'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 20
export const POST = async (request: Request): Promise<Response> => {
  const { context, configured, clearSession } = await readNotificationContext()
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
