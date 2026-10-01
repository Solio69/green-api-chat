import { API_ERROR_CODE } from '@/lib/api/constants'

const {
  RATE_LIMITED,
  SERVICE_UNAVAILABLE,
  RETRY_LATER,
  INVALID_UPSTREAM_RESPONSE,
  SERVER_UNAVAILABLE,
} = API_ERROR_CODE

export const RECIPIENT_COPY = {
  HEADING: 'Поиск получателя',
  MODE_LABEL: 'Способ поиска',
  PHONE_MODE: 'Телефон',
  USERNAME_MODE: '@username',
  PHONE_LABEL: 'Номер телефона',
  USERNAME_LABEL: 'Telegram username',
  PHONE_HINT: 'Введите номер с кодом страны, только цифры.',
  USERNAME_HINT: 'Можно вводить с @ или без него',
  SUBMIT: 'Найти',
  SUBMITTING: 'Поиск...',
  PHONE_REQUIRED: 'Введите номер телефона',
  PHONE_INVALID: 'Укажите номер с кодом страны, только цифры',
  USERNAME_REQUIRED: 'Введите @username',
  USERNAME_INVALID: 'Введите корректный @username',
  FOUND: 'Пользователь найден',
  WRITE: 'Написать',
  PHONE_NOT_FOUND:
    'Не удалось найти пользователя по номеру. Проверьте номер или попробуйте поиск по @username',
  USERNAME_NOT_FOUND:
    'Пользователь не найден. Проверьте @username и попробуйте ещё раз',
  SWITCH_TO_USERNAME: 'Найти по @username',
  NO_SCRIPT: 'Для поиска включите JavaScript в браузере',
} as const

export const RECIPIENT_ERROR_COPY = {
  [RATE_LIMITED]:
    'Слишком много проверок. Повторите поиск через несколько секунд.',
  [SERVICE_UNAVAILABLE]: 'GREEN-API временно недоступен. Попробуйте ещё раз.',
  [RETRY_LATER]: 'Инстанс запускается. Повторите поиск позже.',
  [INVALID_UPSTREAM_RESPONSE]:
    'Не удалось выполнить поиск. Попробуйте ещё раз.',
  [SERVER_UNAVAILABLE]: 'Сервис временно недоступен. Попробуйте позже.',
} as const

export const RECIPIENT_FIELD_ID_SUFFIX = {
  FIELD: '-recipient',
  ERROR: '-recipient-error',
  HINT: '-recipient-hint',
} as const
