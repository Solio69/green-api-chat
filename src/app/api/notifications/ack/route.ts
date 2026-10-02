import { handleNotificationRequest } from '@/lib/notifications/handle-notification-request'
import { readNotificationContext } from '@/lib/notifications/request-context'
import { getReceiverRegistry } from '@/lib/notifications/server-registry'
import { NOTIFICATION_ACTION } from '@/lib/notifications/constants'

const { ACK } = NOTIFICATION_ACTION

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const POST = async (request: Request): Promise<Response> =>
  handleNotificationRequest({
    request,
    action: ACK,
    ...(await readNotificationContext()),
    registry: getReceiverRegistry(),
  })
