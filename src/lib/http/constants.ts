export const HTTP_STATUS = {
  OK: 200,
  SEE_OTHER: 303,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  PROVIDER_RATE_LIMITED: 469,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  SERVER_ERROR_START: 500,
} as const

export const HTTP_METHOD = {
  GET: 'GET',
  POST: 'POST',
} as const

export const FETCH_REDIRECT = {
  ERROR: 'error',
} as const

export const HTTP_HEADERS = {
  CONNECTION_SCOPE: 'X-Connection-Scope',
  ORIGIN: 'Origin',
  HOST: 'Host',
  CONTENT_TYPE: 'Content-Type',
  CACHE_CONTROL: 'Cache-Control',
  LOCATION: 'Location',
} as const

export const CACHE_CONTROL = {
  NO_STORE: 'no-store',
} as const
export const HTTP_CONTENT_TYPE = {
  JSON: 'application/json',
} as const

export const HTTP_SYNTAX = {
  CONTENT_TYPE_PARAMETER_SEPARATOR: ';',
} as const

export const TEXT_ENCODING = {
  UTF_8: 'utf-8',
} as const

export const HTTP_BODY_LIMIT = {
  MAX_REQUEST_BYTES: 8_192,
} as const

export const FETCH_CREDENTIALS = { SAME_ORIGIN: 'same-origin' } as const
export const HTTP_URL_PROTOCOL = { HTTP: 'http:', HTTPS: 'https:' } as const
