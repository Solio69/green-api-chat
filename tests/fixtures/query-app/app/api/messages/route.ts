import { handleSendRequest } from '@/lib/sending/handle-send-request'
import { notificationFixture } from '../../../lib/notification-fixture'

export const POST = (request: Request) =>
  handleSendRequest({
    request,
    context: {
      configured: true,
      credentials: notificationFixture.context.credentials,
      connectionScope: notificationFixture.context.connectionScope,
    },
    send: notificationFixture.send,
    clearSession: async () => undefined,
  })
