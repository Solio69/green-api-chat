import { HTTP_HEADERS, HTTP_URL_PROTOCOL } from '@/shared/kernel/http/constants'
import { EMPTY_STRING } from '@/shared/kernel/ui/constants'
import { HTTP_ORIGIN_CONFIG } from './constants'

const { ORIGIN, HOST } = HTTP_HEADERS
const { HTTP, HTTPS } = HTTP_URL_PROTOCOL
const { ROOT_PATH, INVALID_HOST_PARTS } = HTTP_ORIGIN_CONFIG

export const isSameOrigin = (request: Request): boolean => {
  const origin = request.headers.get(ORIGIN)
  if (origin === null) return false
  try {
    const source = new URL(origin)
    const validSource =
      (source.protocol === HTTP || source.protocol === HTTPS) &&
      source.username === EMPTY_STRING &&
      source.password === EMPTY_STRING &&
      source.pathname === ROOT_PATH &&
      source.search === EMPTY_STRING &&
      source.hash === EMPTY_STRING
    if (!validSource) return false
    const requestUrl = new URL(request.url)
    const host = request.headers.get(HOST)
    if (host === null) return source.origin === requestUrl.origin
    const validHost = host.length > 0 && !INVALID_HOST_PARTS.test(host)
    if (!validHost) return false
    const target = new URL(`${requestUrl.protocol}//${host}`)
    return source.origin === target.origin
  } catch {
    return false
  }
}
