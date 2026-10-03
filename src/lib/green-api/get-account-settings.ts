import { setTimeout as wait } from 'node:timers/promises'
import { classifyBadRequest, classifyState } from './get-state'
import type { InstanceCredentials, StateResult } from './get-state'
import { fetchGreenApi } from './transport'
import { normalizeAccountProfile } from '@/features/account/model'
import type { AccountProfile } from '@/features/account/model'
import { API_ERROR_CODE } from '@/lib/api/constants'
import { HTTP_METHOD, HTTP_STATUS } from '@/lib/http/constants'
import { GREEN_API_CONFIG, GREEN_API_STATES } from './constants'

const { AUTHORIZED } = GREEN_API_STATES
const {
  INVALID_TOKEN,
  INVALID_INSTANCE,
  RATE_LIMITED,
  SERVICE_UNAVAILABLE,
  INVALID_UPSTREAM_RESPONSE,
} = API_ERROR_CODE
const { ACCOUNT_SETTINGS_METHOD, TIMEOUT_MS, RATE_LIMIT_RETRY_DELAY_MS } =
  GREEN_API_CONFIG
const {
  OK,
  BAD_REQUEST,
  UNAUTHORIZED,
  FORBIDDEN,
  TOO_MANY_REQUESTS,
  SERVER_ERROR_START,
} = HTTP_STATUS
const { GET } = HTTP_METHOD

export type AccountSettingsResult =
  | Exclude<StateResult, { kind: typeof AUTHORIZED }>
  | {
      kind: typeof AUTHORIZED
      body: { stateInstance: typeof AUTHORIZED; profile: AccountProfile }
    }

type RetryOptions = { delay: number; signal: AbortSignal }

type GetAccountSettingsOptions = {
  credentials: InstanceCredentials
  fetcher?: typeof fetch
  waitForRetry?: (options: RetryOptions) => Promise<void>
}

const waitForRateLimit = ({ delay, signal }: RetryOptions): Promise<void> =>
  wait(delay, undefined, { signal })

export const getAccountSettings = async ({
  credentials,
  fetcher = fetch,
  waitForRetry = waitForRateLimit,
}: GetAccountSettingsOptions): Promise<AccountSettingsResult> => {
  try {
    const signal = AbortSignal.timeout(TIMEOUT_MS)
    const requestAccount = () =>
      fetchGreenApi({
        credentials,
        methodName: ACCOUNT_SETTINGS_METHOD,
        method: GET,
        signal,
        fetcher,
      })
    let response = await requestAccount()
    if (response.status === TOO_MANY_REQUESTS) {
      await waitForRetry({ delay: RATE_LIMIT_RETRY_DELAY_MS, signal })
      response = await requestAccount()
      if (response.status === TOO_MANY_REQUESTS) return { kind: RATE_LIMITED }
    }
    if (response.status === UNAUTHORIZED) return { kind: INVALID_TOKEN }
    if (response.status === FORBIDDEN) return { kind: INVALID_INSTANCE }
    if (response.status >= SERVER_ERROR_START)
      return { kind: SERVICE_UNAVAILABLE }
    if (response.status === BAD_REQUEST)
      return classifyBadRequest(await response.text())
    if (response.status !== OK) return { kind: INVALID_UPSTREAM_RESPONSE }
    const text = await response.text()
    let value: unknown
    try {
      value = JSON.parse(text)
    } catch {
      return { kind: INVALID_UPSTREAM_RESPONSE }
    }
    const state = classifyState(value)
    if (state.kind !== AUTHORIZED) return state

    return {
      kind: AUTHORIZED,
      body: {
        stateInstance: AUTHORIZED,
        profile: normalizeAccountProfile({ value, credentials }),
      },
    }
  } catch {
    return { kind: SERVICE_UNAVAILABLE }
  }
}
