export const HTTP_STATUS = {
  OK: 200,
  METHOD_NOT_ALLOWED: 405,
} as const;

export const HTTP_HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  CACHE_CONTROL: 'Cache-Control',
} as const;

export const CACHE_CONTROL = {
  NO_STORE: 'no-store',
} as const;
