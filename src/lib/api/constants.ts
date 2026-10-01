export const API_RESPONSE_STATUS = {
  OK: 'ok',
  ERROR: 'error',
} as const

export const API_ERROR_CODE = {
  INVALID_REQUEST: 'invalid_request',
  SESSION_REQUIRED: 'session_required',
  INVALID_TOKEN: 'invalid_token',
  INVALID_INSTANCE: 'invalid_instance',
  NEEDS_AUTHORIZATION: 'needs_authorization',
  INSTANCE_RESTRICTED: 'instance_restricted',
  INSTANCE_EXPIRED: 'instance_expired',
  RETRY_LATER: 'retry_later',
  RATE_LIMITED: 'rate_limited',
  SERVICE_UNAVAILABLE: 'service_unavailable',
  INVALID_UPSTREAM_RESPONSE: 'invalid_upstream_response',
  SERVER_UNAVAILABLE: 'server_unavailable',
} as const
