export const TEST_SERVER = {
  HOST: '127.0.0.1',
  PORT: 3101,
} as const;

const { HOST, PORT } = TEST_SERVER;

export const BASE_URL = `http://${HOST}:${PORT}`;

export const TEST_TIMEOUTS = {
  SERVER_START: 120_000,
  RUN: 240_000,
  TEST: 30_000,
  EXPECT: 5_000,
  REQUEST: 10_000,
  ACTION: 10_000,
  NAVIGATION: 10_000,
} as const;

export const ROUTES = {
  HOME: '/',
  HEALTH: '/api/health',
} as const;

export const PAGE = {
  HEADING: 'GREEN-API Chat',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  METHOD_NOT_ALLOWED: 405,
} as const;

export const HTTP_HEADERS = {
  CONTENT_TYPE: 'content-type',
  CACHE_CONTROL: 'cache-control',
} as const;

export const HEALTH_RESPONSE = {
  status: 'ok',
} as const;

export const CACHE_CONTROL = {
  NO_STORE: 'no-store',
} as const;

export const JSON_CONTENT_TYPE =
  /^application\/json(?:\s*;\s*charset\s*=\s*(?:utf-8|"utf-8"))?\s*$/i;
