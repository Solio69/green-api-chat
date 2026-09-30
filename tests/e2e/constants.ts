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

// Expected public behavior is independent of the constants used by the app.
export const LOGIN_CONTRACT = {
  HEADING: 'Подключение к GREEN-API',
  ID_LABEL: 'idInstance',
  TOKEN_LABEL: 'apiTokenInstance',
  REQUIRED_HINT: 'Оба поля обязательны',
  SUBMIT: 'Войти',
  SHOW_TOKEN: 'Показать токен',
  HIDE_TOKEN: 'Скрыть токен',
  ID_ERROR: 'Введите idInstance',
  TOKEN_ERROR: 'Введите apiTokenInstance',
  HELP_QUESTION: 'Где взять реквизиты?',
  CABINET_LABEL: 'Открыть личный кабинет GREEN-API',
  CABINET_URL: 'https://console.green-api.com/',
  NEW_TAB: 'Откроется в новой вкладке.',
  NO_SCRIPT: 'Для работы формы включите JavaScript в браузере',
} as const;

export const HTML_CONTRACT = {
  INPUT_TEXT: 'text',
  INPUT_PASSWORD: 'password',
  ARIA_LIVE_POLITE: 'polite',
  LINK_TARGET_NEW_TAB: '_blank',
  LINK_REL_EXTERNAL: ['noopener', 'noreferrer'],
} as const;

export const HEALTH_CONTRACT = {
  HTTP_OK: 200,
  METHOD_NOT_ALLOWED: 405,
  CONTENT_TYPE_HEADER: 'content-type',
  CACHE_CONTROL_HEADER: 'cache-control',
  CACHE_CONTROL_VALUE: 'no-store',
  RESPONSE_STATUS: 'ok',
} as const;

export const MIN_TOUCH_TARGET_SIZE = 44;
export const WHITESPACE_ONLY = '   ';

export const CREDENTIALS = {
  ID: '0000123456789',
  TOKEN: ' fictional-token-ONLY-for-e2e-42&<> ',
} as const;

export const VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 1280, height: 720 },
] as const;

export const JSON_CONTENT_TYPE =
  /^application\/json(?:\s*;\s*charset\s*=\s*(?:utf-8|"utf-8"))?\s*$/i;
