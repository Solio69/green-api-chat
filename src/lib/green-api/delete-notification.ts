import { notificationRequest } from './notification-request'
import { isRecord } from '@/lib/api/is-record'
import { ReceiverError } from '@/lib/notifications/receiver-error'
import type { ReceiverContext } from '@/lib/notifications/types'
import { HTTP_METHOD } from '@/lib/http/constants'
import { NOTIFICATION_CODE } from '@/lib/notifications/constants'
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
