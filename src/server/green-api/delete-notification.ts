import { notificationRequest } from './notification-request'
import type { ReceiverContext } from '@/features/conversation/notifications/model'
import {
  ReceiverError,
  NOTIFICATION_CODE,
} from '@/features/conversation/notifications/model'
import { isRecord } from '@/shared/kernel/api/is-record'
import { HTTP_METHOD } from '@/shared/kernel/http/constants'
import { GREEN_API_CONFIG } from './constants'

const { INVALID_UPSTREAM } = NOTIFICATION_CODE
const { DELETE_NOTIFICATION_METHOD } = GREEN_API_CONFIG
const { DELETE } = HTTP_METHOD

export const deleteNotification = async ({
  receiptId,
  ...options
}: {
  context: ReceiverContext
  receiptId: number
  signal: AbortSignal
  fetcher?: typeof fetch
}): Promise<boolean> => {
  const validReceipt = Number.isSafeInteger(receiptId) && receiptId > 0
  if (!validReceipt) throw new ReceiverError({ code: INVALID_UPSTREAM })
  const value = await notificationRequest({
    ...options,
    methodName: DELETE_NOTIFICATION_METHOD,
    method: DELETE,
    suffix: `/${receiptId}`,
  })
  const valid = isRecord(value) && typeof value.result === 'boolean'
  if (!valid) throw new ReceiverError({ code: INVALID_UPSTREAM })
  return value.result as boolean
}
