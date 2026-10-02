import { handleNotificationRequest } from '@/lib/notifications/handle-notification-request'
import { readNotificationContext } from '@/lib/notifications/request-context'
import { getReceiverRegistry } from '@/lib/notifications/server-registry'
import { NOTIFICATION_ACTION } from '@/lib/notifications/constants'

const { STREAM } = NOTIFICATION_ACTION

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const GET = async (request: Request): Promise<Response> =>
  handleNotificationRequest({
    request,
    action: STREAM,
    ...(await readNotificationContext()),
    registry: getReceiverRegistry(),
  })
