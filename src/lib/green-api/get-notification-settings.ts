import { notificationRequest } from './notification-request'
import { isRecord } from '@/lib/api/is-record'
import { ReceiverError } from '@/lib/notifications/receiver-registry'
import type {
  ReceiverContext,
  NotificationSettings,
} from '@/lib/notifications/types'
import {
  NOTIFICATION_CODE,
  PROVIDER_NOTIFICATION,
} from '@/lib/notifications/constants'
import { EMPTY_STRING } from '@/lib/ui/constants'
import { GREEN_API_CONFIG } from './constants'

const { NOTIFICATION_SETTINGS_METHOD } = GREEN_API_CONFIG
const { INVALID_UPSTREAM, NOT_CONFIGURED } = NOTIFICATION_CODE

const { YES, NO, TELEGRAM } = PROVIDER_NOTIFICATION
const toggleFields = [
  'incomingWebhook',
  'outgoingMessageWebhook',
  'outgoingAPIMessageWebhook',
  'outgoingWebhook',
] as const
export const getNotificationSettings = async ({
  context,
  fetcher,
}: {
  context: ReceiverContext
  fetcher?: typeof fetch
}): Promise<NotificationSettings> => {
  const value = await notificationRequest({
    context,
    methodName: NOTIFICATION_SETTINGS_METHOD,
    fetcher,
  })
  if (!isRecord(value)) throw new ReceiverError({ code: INVALID_UPSTREAM })
  const valid =
    typeof value.typeInstance === 'string' &&
    typeof value.webhookUrl === 'string' &&
    (value.incomingWebhook === YES || value.incomingWebhook === NO) &&
    toggleFields
      .slice(1)
      .every(
        (field) =>
          value[field] === undefined ||
          value[field] === YES ||
          value[field] === NO,
      )
  if (!valid) throw new ReceiverError({ code: INVALID_UPSTREAM })
  const configured =
    value.typeInstance === TELEGRAM &&
    value.webhookUrl === EMPTY_STRING &&
    value.incomingWebhook === YES
  if (!configured) throw new ReceiverError({ code: NOT_CONFIGURED })
  return {
    outgoingEnabled: toggleFields
      .slice(1)
      .every((field) => value[field] === YES),
  }
}
