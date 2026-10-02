import { handleNotificationRequest } from '@/lib/notifications/handle-notification-request'
import type { NotificationRequestOptions } from '@/lib/notifications/handle-notification-request'
import { notificationFixture } from '../../../../lib/notification-fixture'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const handle = async (
  request: Request,
  route: { params: Promise<{ action: string }> },
) => {
  const { action } = await route.params
  const allowed = ['claim', 'stream', 'ack', 'release'].includes(action)
  if (!allowed) return new Response(null, { status: 404 })
  return handleNotificationRequest({
    request,
    action: action as NotificationRequestOptions['action'],
    context: notificationFixture.context,
    configured: true,
    registry: notificationFixture.registry,
    clearSession: async () => undefined,
  })
}
export const GET = handle
export const POST = handle
