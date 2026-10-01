export const TEST_SERVER = {
  HOST: '127.0.0.1',
  PORT: 3101,
} as const

const { HOST, PORT } = TEST_SERVER

export const BASE_URL = `http://${HOST}:${PORT}`

export const TEST_TIMEOUTS = {
  SERVER_START: 120_000,
  RUN: 240_000,
  TEST: 30_000,
  EXPECT: 5_000,
  REQUEST: 10_000,
  ACTION: 10_000,
  NAVIGATION: 10_000,
} as const

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  LOGIN_API: '/api/auth/login',
  HEALTH: '/api/health',
} as const

export const ROUTE_PATTERNS = {
  LOGIN_API: `**${ROUTES.LOGIN_API}`,
} as const

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
  INVALID_TOKEN: 'Проверьте apiTokenInstance',
  INVALID_INSTANCE: 'Проверьте idInstance',
  SERVICE_UNAVAILABLE: 'GREEN-API временно недоступен. Повторите попытку.',
  RATE_LIMITED:
    'Слишком много запросов к GREEN-API. Повторите через несколько секунд.',
  PENDING: 'Проверка...',
  TRANSIENT_TEXT: /успешн|авторизован|загрузка/i,
} as const

export const HTML_CONTRACT = {
  INPUT_TEXT: 'text',
  INPUT_PASSWORD: 'password',
  ARIA_LIVE_POLITE: 'polite',
  LINK_TARGET_NEW_TAB: '_blank',
  LINK_REL_EXTERNAL: ['noopener', 'noreferrer'],
} as const

export const TEST_UI = {
  ROLE_BUTTON: 'button',
  ROLE_HEADING: 'heading',
  ROLE_LINK: 'link',
  INPUT_SELECTOR: 'input',
  OUTPUT_SELECTOR: 'pre',
  FORM_SELECTOR: 'form',
  SVG_SELECTOR: 'svg',
  MAIN_SELECTOR: 'main',
  H1_SELECTOR: 'h1',
  CONTROL_SELECTOR: 'input, button, a',
  ATTR_TYPE: 'type',
  ATTR_TITLE: 'title',
  ATTR_ID: 'id',
  ATTR_REQUIRED: 'required',
  ATTR_ARIA_HIDDEN: 'aria-hidden',
  ATTR_ARIA_INVALID: 'aria-invalid',
  ATTR_ARIA_DESCRIBEDBY: 'aria-describedby',
  ATTR_ARIA_LIVE: 'aria-live',
  ATTR_HREF: 'href',
  ATTR_TARGET: 'target',
  ATTR_REL: 'rel',
  ATTR_NAME: 'name',
  BOOLEAN_TRUE: 'true',
  BOOLEAN_FALSE: 'false',
  KEY_ENTER: 'Enter',
  KEY_SPACE: 'Space',
  KEY_TAB: 'Tab',
  KEY_SHIFT_TAB: 'Shift+Tab',
  EVENT_POPUP: 'popup',
  EVENT_FRAME_NAVIGATED: 'framenavigated',
  EVENT_REQUEST: 'request',
  EVENT_CONSOLE: 'console',
  RESOURCE_SCRIPT: 'script',
  STYLE_NONE: 'none',
} as const

export const TEST_BROWSER_FIXTURES = {
  BLOCKED_SCRIPT_ROUTE: '**/*',
  CABINET_HTML: '<title>Cabinet test fixture</title>',
  HTML_CONTENT_TYPE: 'text/html',
  ID_WITHOUT_FORMAT: 'arbitrary-id',
  TOKEN_WITHOUT_FORMAT: 'x',
  ID_FIELD: 'id',
  TOKEN_FIELD: 'token',
  DISABLED: 'disabled',
  BLOCKED: 'blocked',
  INITIAL: 'initial',
  ERRORS: 'errors',
  LOG_SEPARATOR: '\n',
} as const

export const LOGIN_API_CONTRACT = {
  OK_STATUS: 200,
  INVALID_REQUEST_STATUS: 400,
  UNAUTHORIZED_STATUS: 401,
  FORBIDDEN_STATUS: 403,
  CONFLICT_STATUS: 409,
  RATE_LIMIT_STATUS: 429,
  BAD_GATEWAY_STATUS: 502,
  UNAVAILABLE_STATUS: 503,
  RESPONSE_OK: 'ok',
  RESPONSE_ERROR: 'error',
  INVALID_REQUEST: 'invalid_request',
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
  JSON_CONTENT_TYPE: 'application/json',
  CACHE_CONTROL_HEADER: 'Cache-Control',
  CONTENT_TYPE_HEADER: 'Content-Type',
  CACHE_CONTROL_VALUE: 'no-store',
} as const

export const GREEN_API_CONTRACT = {
  HOST: 'https://4100.api.green-api.com',
  INSTANCE_PREFIX: 'waInstance',
  STATE_METHOD: 'getStateInstance',
  AUTHORIZED: 'authorized',
  NOT_AUTHORIZED: 'notAuthorized',
  PENDING_PASSWORD: 'pendingPassword',
  BLOCKED: 'blocked',
  SUSPENDED: 'suspended',
  STARTING: 'starting',
  UNKNOWN: 'unrecognized',
  STARTING_MESSAGE: 'instance in starting process try later',
  AMBIGUOUS_MESSAGE: 'instance is starting or not authorized',
  EXPIRED_MESSAGE:
    'Instance account is expired. Renew your instance from personal area',
} as const

export const HOME_CONTRACT = {
  LOGIN: 'login',
  AUTHORIZED: GREEN_API_CONTRACT.AUTHORIZED,
  END_SESSION: 'end-session',
  RETRY: 'retry',
  ACCESS_LOST_REDIRECT: 'http://localhost/login?reason=access_lost',
  END_SESSION_UNTRUSTED_URL:
    'http://localhost/api/auth/end-session?next=https://attacker.invalid',
  REDIRECT_STATUS: 303,
  LOCATION_HEADER: 'Location',
  SET_COOKIE_HEADER: 'Set-Cookie',
} as const

export const SESSION_CONTRACT = {
  COOKIE_NAME: 'green-api-chat-session',
  SAME_SITE: 'lax',
  PATH: '/',
  MAX_AGE: 86_400,
  EXPIRED_COOKIE_PATTERN: /Max-Age=0|Expires=Thu, 01 Jan 1970/i,
} as const

export const TEST_PROVIDER_FIXTURES = {
  DETAIL: 'provider detail',
  IGNORED_EXTRA: 'ignored',
  UNKNOWN_ERROR: 'unknown provider error',
  RATE_LIMITED: 'rate limited',
  BAD_JSON: '{bad json',
  EMPTY_JSON: '{}',
  NON_STRING_STATE: '{"stateInstance":42}',
  UNKNOWN_STATE: '{"stateInstance":"unrecognized"}',
} as const

export const TEST_FETCH_CONTRACT = {
  METHOD_GET: 'GET',
  METHOD_POST: 'POST',
  CACHE_NO_STORE: LOGIN_API_CONTRACT.CACHE_CONTROL_VALUE,
  REDIRECT_ERROR: 'error',
  TIMEOUT_MS: 10_000,
  RATE_LIMIT_DELAY_MS: 1_100,
  RATE_LIMIT_STATUS: LOGIN_API_CONTRACT.RATE_LIMIT_STATUS,
  PROVIDER_BAD_REQUEST_STATUS: LOGIN_API_CONTRACT.INVALID_REQUEST_STATUS,
} as const

export const TEST_REQUEST_FIXTURES = {
  BROKEN_JSON: '{broken',
  SHORT_BROKEN_JSON: '{bad',
  ARRAY_JSON: '[]',
  EMPTY_OBJECT_JSON: '{}',
  WHITESPACE: '  ',
  OVERSIZE_FILL: 'x',
  PLAIN_CONTENT_TYPE: 'text/plain',
  OVERSIZE_BODY_LENGTH: 8_193,
  EXTRA_BODY_LENGTH: 8_192,
  NON_STRING_ID: 42,
} as const

export const TEST_SESSION_FIXTURES = {
  PASSWORD: 'fictional-32-character-session-secret-for-tests',
  SHORT_PASSWORD: 'short',
  ALTERED_COOKIE_OLD: 'a',
  ALTERED_COOKIE_NEW: 'b',
  BLANK_ID: ' ',
} as const

export const HEALTH_CONTRACT = {
  HTTP_OK: LOGIN_API_CONTRACT.OK_STATUS,
  METHOD_NOT_ALLOWED: 405,
  CONTENT_TYPE_HEADER: LOGIN_API_CONTRACT.CONTENT_TYPE_HEADER.toLowerCase(),
  CACHE_CONTROL_HEADER: LOGIN_API_CONTRACT.CACHE_CONTROL_HEADER.toLowerCase(),
  CACHE_CONTROL_VALUE: LOGIN_API_CONTRACT.CACHE_CONTROL_VALUE,
  RESPONSE_STATUS: LOGIN_API_CONTRACT.RESPONSE_OK,
} as const

export const MIN_TOUCH_TARGET_SIZE = 44
export const WHITESPACE_ONLY = '   '

export const CREDENTIALS = {
  ID: '0000123456789',
  TOKEN: ' fictional-token-ONLY-for-e2e-42&<> ',
} as const

export const VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 1280, height: 720 },
] as const

export const JSON_CONTENT_TYPE =
  /^application\/json(?:\s*;\s*charset\s*=\s*(?:utf-8|"utf-8"))?\s*$/i
