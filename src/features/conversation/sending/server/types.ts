import type {
  ProviderSendResult,
  SendMessageOptions,
} from '@/server/green-api/send-message.types'
import type { InstanceCredentials } from '@/shared/kernel/api/instance-credentials'

export type SendRequestOptions = {
  request: Request
  context: {
    configured: boolean
    credentials: InstanceCredentials | null
    connectionScope: string | null
  }
  send: (options: SendMessageOptions) => Promise<ProviderSendResult>
  clearSession: () => Promise<void>
}
