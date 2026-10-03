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
  LOGOUT_API: '/api/auth/logout',
  RECIPIENT_SEARCH_API: '/api/recipients/search',
  HEALTH: '/api/health',
} as const

export const ROUTE_PATTERNS = {
  LOGIN_API: `**${ROUTES.LOGIN_API}`,
  RECIPIENT_SEARCH_API: `**${ROUTES.RECIPIENT_SEARCH_API}`,
} as const

export const HTML_CONTRACT = {
  INPUT_TEXT: 'text',
  INPUT_PASSWORD: 'password',
  ARIA_LIVE_POLITE: 'polite',
  LINK_TARGET_NEW_TAB: '_blank',
  LINK_REL_EXTERNAL: ['noopener', 'noreferrer'],
} as const

export const TEST_UI = {
  ROLE_REGION: 'region',
  ROLE_BUTTON: 'button',
  ROLE_TEXTBOX: 'textbox',
  ROLE_HEADING: 'heading',
  ROLE_LINK: 'link',
  ROLE_STATUS: 'status',
  ROLE_LIST: 'list',
  ROLE_LIST_ITEM: 'listitem',
  ROLE_ALERT: 'alert',
  ROLE_COMPLEMENTARY: 'complementary',
  QUERY_OUTPUT_SELECTOR: 'output',
  INPUT_SELECTOR: 'input',
  OUTPUT_SELECTOR: 'pre',
  FORM_SELECTOR: 'form',
  SVG_SELECTOR: 'svg',
  MAIN_SELECTOR: 'main',
  SECTION_SELECTOR: 'section',
  H1_SELECTOR: 'h1',
  PARAGRAPH_SELECTOR: 'p',
  PARENT_SELECTOR: '..',
  CONTROL_SELECTOR: 'input, button, a',
  ATTR_TYPE: 'type',
  ATTR_SRC: 'src',
  ATTR_ALT: 'alt',
  ATTR_TITLE: 'title',
  ATTR_ID: 'id',
  ATTR_REQUIRED: 'required',
  ATTR_ARIA_HIDDEN: 'aria-hidden',
  ATTR_ARIA_INVALID: 'aria-invalid',
  ATTR_ARIA_DESCRIBEDBY: 'aria-describedby',
  ATTR_ARIA_LIVE: 'aria-live',
  ATTR_ARIA_PRESSED: 'aria-pressed',
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

export const MIN_TOUCH_TARGET_SIZE = 44

export const WHITESPACE_ONLY = '   '

export const VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 1280, height: 720 },
] as const

export const JSON_CONTENT_TYPE =
  /^application\/json(?:\s*;\s*charset\s*=\s*(?:utf-8|"utf-8"))?\s*$/i
