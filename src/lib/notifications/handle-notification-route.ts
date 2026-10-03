import { handleNotificationRequest } from './handle-notification-request'
import type { NotificationRequestOptions } from './handle-notification-request'
import { readNotificationContext } from './request-context'
import { deleteNotification } from '@/lib/green-api/delete-notification'
import { getNotificationSettings } from '@/lib/green-api/get-notification-settings'
import { receiveNotification } from '@/lib/green-api/receive-notification'

export const handleNotificationRoute = async ({
  request,
  action,
}: {
  request: Request
  action: NotificationRequestOptions['action']
}) => {
  const context = await readNotificationContext()
  return handleNotificationRequest({
    request,
    action,
    ...context,
    provider: {
      settings: (context) => getNotificationSettings({ context }),
      receive: receiveNotification,
      delete: deleteNotification,
    },
  })
}
