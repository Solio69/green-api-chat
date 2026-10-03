import type { AccountSettingsResult } from '@/features/account/server'
import { HOME_RESULT_KIND } from '@/features/auth/model'
import type { InstanceCredentials } from '@/lib/green-api/get-state'
import { API_ERROR_CODE } from '@/lib/api/constants'
import { GREEN_API_STATES } from '@/lib/green-api/constants'

const { AUTHORIZED } = GREEN_API_STATES
const { LOGIN, END_SESSION, RETRY } = HOME_RESULT_KIND
const {
  INVALID_TOKEN,
  INVALID_INSTANCE,
  NEEDS_AUTHORIZATION,
  INSTANCE_RESTRICTED,
  INSTANCE_EXPIRED,
} = API_ERROR_CODE

export type HomeResult =
  | { kind: typeof LOGIN }
  | { kind: typeof END_SESSION }
  | { kind: typeof RETRY }
  | Extract<AccountSettingsResult, { kind: typeof AUTHORIZED }>

type ResolveHomeOptions = {
  credentials: InstanceCredentials | null
  getAccountSettings: (options: {
    credentials: InstanceCredentials
  }) => Promise<AccountSettingsResult>
}

export const resolveHome = async ({
  credentials,
  getAccountSettings,
}: ResolveHomeOptions): Promise<HomeResult> => {
  if (!credentials) return { kind: LOGIN }
  try {
    const state = await getAccountSettings({ credentials })
    if (state.kind === AUTHORIZED) return { kind: AUTHORIZED, body: state.body }
    switch (state.kind) {
      case INVALID_TOKEN:
      case INVALID_INSTANCE:
      case NEEDS_AUTHORIZATION:
      case INSTANCE_RESTRICTED:
      case INSTANCE_EXPIRED:
        return { kind: END_SESSION }
      default:
        return { kind: RETRY }
    }
  } catch {
    return { kind: RETRY }
  }
}
