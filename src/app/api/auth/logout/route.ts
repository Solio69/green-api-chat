import { NextResponse } from 'next/server'
import { AUTH_CONFIG } from '@/features/auth/server'
import { CACHE_CONTROL, HTTP_HEADERS, HTTP_STATUS } from '@/lib/http/constants'
import { ROUTES } from '@/lib/routes/constants'

const { COOKIE_NAME } = AUTH_CONFIG
const { CACHE_CONTROL: CACHE_CONTROL_HEADER, LOCATION: LOCATION_HEADER } =
  HTTP_HEADERS
const { NO_STORE } = CACHE_CONTROL
const { SEE_OTHER: HTTP_SEE_OTHER } = HTTP_STATUS
const { LOGIN } = ROUTES

export const POST = async (): Promise<NextResponse> => {
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
