import recipientScenarios from './e2e/fixtures/scenarios.json'

export const RECIPIENT_SCENARIOS = recipientScenarios

export const RECIPIENT_CONTRACT = {
  LOGOUT: 'Выйти',
  SEARCH_HEADING: 'Поиск получателя',
  PHONE_MODE: 'Телефон',
  USERNAME_MODE: '@username',
  PHONE_LABEL: 'Номер телефона',
  PHONE_HINT: 'Введите номер с кодом страны, только цифры.',
  USERNAME_HINT: 'Можно вводить с @ или без него',
  USERNAME_LABEL: 'Telegram username',
  SUBMIT: 'Найти',
  WRITE: 'Написать',
  PENDING: 'Поиск...',
  FOUND: 'Пользователь найден',
  PHONE_NOT_FOUND:
    'Не удалось найти пользователя по номеру. Проверьте номер или попробуйте поиск по @username',
  USERNAME_NOT_FOUND:
    'Пользователь не найден. Проверьте @username и попробуйте ещё раз',
  SWITCH_TO_USERNAME: 'Найти по @username',
  PHONE_REQUIRED: 'Введите номер телефона',
  PHONE_INVALID: 'Укажите номер с кодом страны, только цифры',
  USERNAME_REQUIRED: 'Введите @username',
  USERNAME_INVALID: 'Введите корректный @username',
  RATE_LIMITED:
    'Слишком много проверок. Повторите поиск через несколько секунд.',
  SERVICE_UNAVAILABLE: 'GREEN-API временно недоступен. Попробуйте ещё раз.',
} as const

export const RECIPIENT_API_CONTRACT = {
  MODE_PHONE: 'phone',
  MODE_USERNAME: 'username',
  RESULT_FOUND: 'found',
  RESULT_NOT_FOUND: 'not_found',
  SESSION_REQUIRED: 'session_required',
  RATE_LIMIT_REASON: 'rate_limit_exceeded',
  PROVIDER_RATE_LIMIT_STATUS: 469,
  MAX_LENGTH_USERNAME: 'a'.repeat(32),
  TOO_LONG_USERNAME: 'a'.repeat(33),
  SHORT_USERNAME: 'a',
} as const
