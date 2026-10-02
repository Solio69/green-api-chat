import { sendMessage } from '@/lib/green-api/send-message'
import { readNotificationContext } from '@/lib/notifications/request-context'
import { getReceiverRegistry } from '@/lib/notifications/server-registry'
import { handleSendRequest } from '@/lib/sending/handle-send-request'
import { NOTIFICATION_CONFIG } from '@/lib/notifications/constants'

const { OWNER_HEADER } = NOTIFICATION_CONFIG

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const POST = async (request: Request): Promise<Response> => {
  const { context, configured, clearSession } = await readNotificationContext()
  const registry = getReceiverRegistry()
  const ownerCapability = request.headers.get(OWNER_HEADER)
  const clearOwnedSession = async () => {
    if (context && ownerCapability)
      registry.revokeOwner({ ...context, ownerCapability })
    await clearSession()
  }
  return handleSendRequest({
    request,
    context: {
      configured,
      credentials: context?.credentials ?? null,
      connectionScope: context?.connectionScope ?? null,
      ownerCapability,
    },
    send: sendMessage,
    clearSession: clearOwnedSession,
    tryAcquireSend: registry.tryAcquireSend,
  })
}
