import { notificationRequest } from './notification-request'
import type { ReceiverContext } from '@/lib/notifications/types'
import { NOTIFICATION_CONFIG } from '@/lib/notifications/constants'
import { GREEN_API_CONFIG } from './constants'

const { RECEIVE_NOTIFICATION_METHOD } = GREEN_API_CONFIG
const { RECEIVE_TIMEOUT_SECONDS } = NOTIFICATION_CONFIG

export const receiveNotification = (options: {
  context: ReceiverContext
  signal: AbortSignal
  fetcher?: typeof fetch
}): Promise<unknown> =>
  notificationRequest({
    ...options,
    methodName: RECEIVE_NOTIFICATION_METHOD,
    suffix: `?receiveTimeout=${RECEIVE_TIMEOUT_SECONDS}`,
  })
