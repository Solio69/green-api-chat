import { NextResponse } from 'next/server'
import { readNotificationContext } from '@/lib/notifications/request-context'
import { getReceiverRegistry } from '@/lib/notifications/server-registry'
import { AUTH_CONFIG } from '@/lib/auth/constants'
import { CACHE_CONTROL, HTTP_HEADERS, HTTP_STATUS } from '@/lib/http/constants'
import { NOTIFICATION_CONFIG } from '@/lib/notifications/constants'
import { ROUTES } from '@/lib/routes/constants'

const { OWNER_HEADER } = NOTIFICATION_CONFIG
const { CONNECTION_SCOPE } = HTTP_HEADERS
const { COOKIE_NAME } = AUTH_CONFIG
const { CACHE_CONTROL: CACHE_CONTROL_HEADER, LOCATION: LOCATION_HEADER } =
  HTTP_HEADERS
const { NO_STORE } = CACHE_CONTROL
const { SEE_OTHER: HTTP_SEE_OTHER } = HTTP_STATUS
const { LOGIN } = ROUTES

export const POST = async (request: Request): Promise<NextResponse> => {
  const { context } = await readNotificationContext()
  const ownerCapability = request.headers.get(OWNER_HEADER)
  const matching =
    context !== null &&
    ownerCapability !== null &&
    request.headers.get(CONNECTION_SCOPE) === context.connectionScope
  if (matching)
    getReceiverRegistry().revokeOwner({ ...context, ownerCapability })
  const response = new NextResponse(null, {
    status: HTTP_SEE_OTHER,
    headers: {
      [LOCATION_HEADER]: LOGIN,
      [CACHE_CONTROL_HEADER]: NO_STORE,
    },
  })
  response.cookies.delete(COOKIE_NAME)

  return response
}
