import type { InstanceCredentials } from '@/lib/green-api/get-state'
import type { MessageDTO, ProviderMessageStatus } from '@/lib/messages/types'
import type { API_RESPONSE_STATUS } from '@/lib/api/constants'

export type OwnerContext = {
  connectionScope: string
  ownerEpoch: string
  ownerCapability: string
}
export type ReceiverContext = {
  credentials: InstanceCredentials
  connectionScope: string
  expiresAt: number
  ownerCapability?: string
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
export type NotificationSink = {
  emit: (frame: { event: string; data: unknown }) => boolean
  close: () => void
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
export type ReceiverFailure = {
  kind: typeof API_RESPONSE_STATUS.ERROR
  code: string
}
export type ClaimResult =
  | {
      kind: typeof API_RESPONSE_STATUS.OK
      ownerCapability: string
      ownerEpoch: string
      outgoingEnabled: boolean
    }
  | ReceiverFailure

export type OwnerAttachmentResult =
  | {
      kind: typeof API_RESPONSE_STATUS.OK
      streamGeneration: number
      ownerEpoch: string
    }
  | ReceiverFailure

export type DeliveryAckResult =
  { kind: typeof API_RESPONSE_STATUS.OK } | ReceiverFailure
