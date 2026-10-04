import type { AccountProfile } from './types'
import type { StateResult, GREEN_API_STATES } from '@/features/auth/model'

export type AccountSettingsResult =
  | Exclude<StateResult, { kind: typeof GREEN_API_STATES.AUTHORIZED }>
  | {
      kind: typeof GREEN_API_STATES.AUTHORIZED
      body: {
        stateInstance: typeof GREEN_API_STATES.AUTHORIZED
        profile: AccountProfile
      }
    }
