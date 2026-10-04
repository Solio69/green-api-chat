import { CACHE_CONTROL, HTTP_HEADERS } from '@/shared/kernel/http/constants'

const { CACHE_CONTROL: CACHE_CONTROL_HEADER } = HTTP_HEADERS
const { NO_STORE } = CACHE_CONTROL

export const jsonNoStore = ({
  body,
  status,
}: {
  body: object
  status: number
}): Response =>
  Response.json(body, {
    status,
    headers: { [CACHE_CONTROL_HEADER]: NO_STORE },
  })
