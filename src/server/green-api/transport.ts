import type { InstanceCredentials } from '@/shared/kernel/api/instance-credentials'
import {
  CACHE_CONTROL,
  FETCH_REDIRECT,
  HTTP_CONTENT_TYPE,
  HTTP_HEADERS,
} from '@/shared/kernel/http/constants'
import { GREEN_API_CONFIG } from './constants'

const { HOST, INSTANCE_PATH_PREFIX } = GREEN_API_CONFIG
const { NO_STORE } = CACHE_CONTROL
const { ERROR } = FETCH_REDIRECT
const { CONTENT_TYPE } = HTTP_HEADERS
const { JSON: JSON_CONTENT_TYPE } = HTTP_CONTENT_TYPE

export type GreenApiRequest = {
  credentials: InstanceCredentials
  methodName: string
  method: string
  suffix?: string
  jsonBody?: unknown
  signal: AbortSignal
  fetcher?: typeof fetch
}

export const fetchGreenApi = ({
  credentials,
  methodName,
  method,
  suffix = '',
  jsonBody,
  signal,
  fetcher = fetch,
}: GreenApiRequest): Promise<Response> => {
  const id = encodeURIComponent(credentials.idInstance)
  const token = encodeURIComponent(credentials.apiTokenInstance)
  const url = `${HOST}/${INSTANCE_PATH_PREFIX}${id}/${methodName}/${token}${suffix}`
  const jsonOptions =
    jsonBody === undefined
      ? {}
      : {
          headers: { [CONTENT_TYPE]: JSON_CONTENT_TYPE },
          body: JSON.stringify(jsonBody),
        }
  return fetcher(url, {
    method,
    cache: NO_STORE,
    redirect: ERROR,
    signal,
    ...jsonOptions,
  })
}
