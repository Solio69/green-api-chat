import { NextResponse } from 'next/server'
import { AUTH_CONFIG, AUTH_QUERY } from '@/lib/auth/constants'
import { HTTP_STATUS } from '@/lib/http/constants'
import { ROUTES } from '@/lib/routes/constants'

const { COOKIE_NAME } = AUTH_CONFIG
const { REASON, ACCESS_LOST } = AUTH_QUERY
const { SEE_OTHER: HTTP_SEE_OTHER } = HTTP_STATUS
const { LOGIN } = ROUTES

export function GET(request: Request): NextResponse {
  const url = new URL(LOGIN, request.url)
  url.searchParams.set(REASON, ACCESS_LOST)
  const response = NextResponse.redirect(url, HTTP_SEE_OTHER)
  response.cookies.delete(COOKIE_NAME)
  return response
}
