import { handleNotificationRoute } from '@/lib/notifications/handle-notification-route'
import { NOTIFICATION_ACTION } from '@/lib/notifications/constants'

const { SETTINGS } = NOTIFICATION_ACTION
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 20
export const POST = (request: Request) =>
  handleNotificationRoute({ request, action: SETTINGS })
