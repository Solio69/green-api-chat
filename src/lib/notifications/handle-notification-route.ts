import { handleNotificationRequest } from './handle-notification-request'
import type { NotificationRequestOptions } from './handle-notification-request'
import { deleteNotification } from '@/lib/green-api/delete-notification'
import { getNotificationSettings } from '@/lib/green-api/get-notification-settings'
import { receiveNotification } from '@/lib/green-api/receive-notification'
import { readRouteSession } from '@/server/session'

export const handleNotificationRoute = async ({
  request,
  action,
}: {
  request: Request
  action: NotificationRequestOptions['action']
}) => {
  const { configured, context, clearSession } = await readRouteSession()
  return handleNotificationRequest({
    request,
    action,
    context,
    configured,
    clearSession,
    password: process.env.SESSION_PASSWORD,
    provider: {
      settings: (context) => getNotificationSettings({ context }),
      receive: receiveNotification,
      delete: deleteNotification,
    },
  })
}
