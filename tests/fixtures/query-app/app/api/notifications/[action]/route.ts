import { handleNotificationRequest } from '@/features/conversation/notifications/server/handle-notification-request'
import { NOTIFICATION_ACTION } from '@/features/conversation/notifications/model/constants'
import { HTTP_STATUS } from '@/shared/kernel/http/constants'
import { notificationFixture } from '../../../../lib/notification-fixture'

const { SETTINGS, RECEIVE, ACK } = NOTIFICATION_ACTION
const { BAD_REQUEST } = HTTP_STATUS
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const handle = async (
  request: Request,
  route: { params: Promise<{ action: string }> },
) => {
  const { action } = await route.params
  const valid = action === SETTINGS || action === RECEIVE || action === ACK
  if (!valid) return new Response(null, { status: BAD_REQUEST })
  return handleNotificationRequest({
    request,
    action,
    context: notificationFixture.context,
    configured: true,
    provider: notificationFixture.provider,
    password: notificationFixture.password,
    clearSession: async () => undefined,
  })
}
export const POST = handle
