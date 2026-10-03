import { CACHE_CONTROL, HTTP_METHOD } from '@/lib/http/constants'
import { ROUTES } from '@/lib/routes/constants'

const { POST } = HTTP_METHOD
const { NO_STORE } = CACHE_CONTROL
const { LOGOUT_API } = ROUTES

export const requestLogout = async ({
  headers,
  fetcher = fetch,
}: {
  headers?: HeadersInit
  fetcher?: typeof fetch
}): Promise<boolean> => {
  try {
    const response = await fetcher(LOGOUT_API, {
      method: POST,
      headers,
      cache: NO_STORE,
    })
    return response.ok
  } catch {
    return false
  }
}
