import accountScenarios from './e2e/fixtures/account-scenarios.json'

export const ACCOUNT_SCENARIOS = accountScenarios

export const ACCOUNT_CONTRACT = {
  METHOD: 'getAccountSettings',
  REGION: 'Ваш Telegram-аккаунт',
  DEFAULT_LABEL: 'Telegram-аккаунт',
  CONNECTED: 'Telegram подключён',
  IMAGE_SELECTOR: 'img',
  REFERRER_POLICY_ATTRIBUTE: 'referrerpolicy',
  REFERRER_POLICY: 'no-referrer',
  RETRY_LINK: 'Повторить проверку',
  MOBILE_VIEWPORT: { width: 360, height: 780 },
  DESKTOP_VIEWPORT: { width: 1280, height: 720 },
  PNG_CONTENT_TYPE: 'image/png',
  // One transparent pixel; a local fixture, never an external download.
  PNG_BASE64:
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=',
  PROFILE: {
    label: '@account_demo',
    avatarUrl: 'https://avatars.example.test/account.png',
  },
  UNSUPPORTED_STATUS: 418,
  SERVER_ERROR_STATUS: 500,
  NETWORK_ERROR: 'fictional provider network failure',
  TIMEOUT_ERROR: 'TimeoutError',
  MISSING_IMAGE_STATUS: 404,
  IMAGE_WIDTH_PROPERTY: 'naturalWidth',
  IMAGE_ENCODING: 'base64',
  ACCESS_LOST_URL_PATTERN: /\/login\?reason=access_lost$/,
} as const
