import type { InstanceCredentials } from '@/lib/green-api/get-state'
import type { MessageDTO, ProviderMessageStatus } from '@/lib/messages/types'

export type OwnerContext = {
  connectionScope: string
  ownerEpoch: string
}
export type ReceiverContext = {
  credentials: InstanceCredentials
  connectionScope: string
  expiresAt: number
}
export type ProviderStatusFact = {
  chatId: string | null
  idMessage: string | null
  status: ProviderMessageStatus
  timestamp: number | null
}
export type NormalizedNotification =
  | {
      kind: 'incoming_message'
      chatId: string
      message: MessageDTO
      displayLabel: string | null
    }
  | { kind: 'message_status'; fact: ProviderStatusFact }
  | { kind: 'ignored'; reason: 'out_of_scope' | 'unsupported_event' }
export type NotificationDelivery = {
  connectionScope: string
  ownerEpoch: string
  deliveryId: string
  event: NormalizedNotification
}
export type NotificationSettings = { outgoingEnabled: boolean }
export type ReceiverProvider = {
  settings: (context: ReceiverContext) => Promise<NotificationSettings>
  receive: (options: {
    context: ReceiverContext
    signal: AbortSignal
  }) => Promise<unknown>
  delete: (options: {
    context: ReceiverContext
    receiptId: number
    signal: AbortSignal
  }) => Promise<boolean>
}
