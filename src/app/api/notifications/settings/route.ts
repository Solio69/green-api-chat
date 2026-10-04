import { handleNotificationRoute } from '@/features/conversation/notifications/server/handle-notification-route'
import { NOTIFICATION_ACTION } from '@/features/conversation/notifications/model/constants'

const { SETTINGS } = NOTIFICATION_ACTION
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 20
export const POST = (request: Request) =>
  handleNotificationRoute({ request, action: SETTINGS })
