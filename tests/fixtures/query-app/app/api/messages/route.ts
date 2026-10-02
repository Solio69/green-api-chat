import { handleSendRequest } from '@/lib/sending/handle-send-request'
import { NOTIFICATION_CONFIG } from '@/lib/notifications/constants'
import { notificationFixture } from '../../../lib/notification-fixture'

export const POST = (request: Request) =>
  handleSendRequest({
    request,
    context: {
      configured: true,
      credentials: notificationFixture.context.credentials,
      connectionScope: notificationFixture.context.connectionScope,
      ownerCapability: request.headers.get(NOTIFICATION_CONFIG.OWNER_HEADER),
    },
    send: notificationFixture.send,
    clearSession: async () => undefined,
    tryAcquireSend: notificationFixture.registry.tryAcquireSend,
  })
