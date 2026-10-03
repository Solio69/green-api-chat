import type { InstanceCredentials } from '@/lib/green-api/get-state'

export type AuthorizedContext = {
  credentials: InstanceCredentials
  connectionScope: string
  expiresAt: number
}

export type SessionReadResult =
  | { kind: 'unconfigured'; configured: false; context: null }
  | { kind: 'missing'; configured: true; context: null }
  | { kind: 'authorized'; configured: true; context: AuthorizedContext }
