import { RECIPIENT_CONTRACT } from './recipients.constants'

export const QUERY_PROBE_IDS = { FIRST: 'first', SECOND: 'second' } as const

export const QUERY_PROBE_COPY = {
  REFRESH: 'Обновить',
  SWITCH_ACCOUNT: 'Аккаунт Б',
  CONSUMERS: 'Потребители',
  STRICT_MODE: 'Strict Mode',
  RENDER: 'Render',
  LOGOUT: RECIPIENT_CONTRACT.LOGOUT,
} as const

export const QUERY_PROBE_CONTRACT = {
  HOME: '/',
  SELECTION_URL: '/?selection=1',
  LOGOUT_ROUTE: '**/api/auth/logout',
  LOGOUT_ERROR: 'Не удалось выйти. Попробуйте ещё раз.',
  LOGIN_PATTERN: /\/login$/,
  HOME_PATTERN: /\/$/,
  OLD_ACCOUNT_LABEL: 'OLD ACCOUNT',
  CONNECTION_CHANGED: 'connection_changed',
  RSC_HEADER: 'rsc',
  RSC_HEADER_VALUE: '1',
  STALE_DELAY_MS: 60_001,
  GC_DELAY_MS: 300_001,
} as const

export const SELECTION_PROBE_IDS = {
  FIRST: 'selection-one',
  SECOND: 'selection-two',
  CACHE: 'cache',
  HISTORY_TARGET: 'history-target',
} as const

export const SELECTION_PROBE_COPY = {
  OPEN: 'Открыть А',
  BACK: 'Вернуть список',
  CLOSE: 'Снять выбор',
  END_SESSION: 'Завершить область',
  SEED_MESSAGES: 'Запомнить сообщения',
  INSPECT_MESSAGES: 'Проверить сообщения',
  SWITCH_SCOPE: 'Другая область',
  HISTORY_PENDING: 'Ожидание истории',
  HISTORY_EMPTY: 'История пуста',
  HISTORY_ERROR: 'Ошибка истории',
  HISTORY_KNOWN: 'Известное сообщение',
  HISTORY_LATE: 'Поздний результат',
  EDITOR: 'Контракт ввода',
  EMPTY_REPLY: 'Пустой ответ',
  ERROR_REPLY: 'Ошибка ответа',
  KNOWN_REPLY: 'Известный ответ',
  LATE_REPLY: 'Поздний ответ',
} as const

export const CHAT_HTTP_CONTRACT = {
  API: '/api/chats',
  SCOPE_HEADER: 'X-Connection-Scope',
  CACHE_HEADER: 'cache-control',
  SESSION_REQUIRED: 'session_required',
  OPTIONS_METHOD: 'OPTIONS',
  OPTIONS_STATUS: 204,
  METHOD_NOT_ALLOWED: 405,
  ALLOW: 'GET, HEAD, OPTIONS',
  UNAUTHORIZED_INSTANCE: '99001403',
  UNAVAILABLE_INSTANCE: '99001404',
} as const
