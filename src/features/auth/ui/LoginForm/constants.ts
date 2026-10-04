import { API_ERROR_CODE } from '@/shared/kernel/api/constants'

const {
  INVALID_REQUEST,
  INVALID_TOKEN,
  INVALID_INSTANCE,
  NEEDS_AUTHORIZATION,
  INSTANCE_RESTRICTED,
  INSTANCE_EXPIRED,
  RETRY_LATER,
  RATE_LIMITED,
  SERVICE_UNAVAILABLE,
  INVALID_UPSTREAM_RESPONSE,
  SERVER_UNAVAILABLE,
} = API_ERROR_CODE

export const LOGIN_COPY = {
  HEADING: 'Подключение к GREEN-API',
  REQUIRED_HINT: 'Оба поля обязательны',
  ID_LABEL: 'idInstance',
  TOKEN_LABEL: 'apiTokenInstance',
  ID_REQUIRED: 'Введите idInstance',
  TOKEN_REQUIRED: 'Введите apiTokenInstance',
  SHOW_TOKEN: 'Показать токен',
  HIDE_TOKEN: 'Скрыть токен',
  SUBMIT: 'Войти',
  SUBMITTING: 'Проверка...',
  CABINET_LABEL: 'Открыть личный кабинет GREEN-API',
  NO_SCRIPT: 'Для работы формы включите JavaScript в браузере',
  ACCESS_LOST: 'Доступ к инстансу больше не подтверждён. Войдите снова.',
} as const

export const LOGIN_FIELD_ID_SUFFIX = {
  INSTANCE: '-instance',
  TOKEN: '-token',
  INSTANCE_ERROR: '-instance-error',
  TOKEN_ERROR: '-token-error',
} as const

export const LOGIN_LINKS = {
  CABINET: 'https://console.green-api.com/',
} as const

export const LOGIN_ERROR_COPY = {
  [INVALID_REQUEST]: 'Проверьте введённые реквизиты.',
  [INVALID_TOKEN]: 'Проверьте apiTokenInstance',
  [INVALID_INSTANCE]: 'Проверьте idInstance',
  [NEEDS_AUTHORIZATION]:
    'Инстанс не авторизован. Проверьте его в личном кабинете GREEN-API.',
  [INSTANCE_RESTRICTED]:
    'Доступ к инстансу ограничен. Проверьте его в личном кабинете GREEN-API.',
  [INSTANCE_EXPIRED]:
    'Срок действия инстанса истёк. Откройте личный кабинет GREEN-API.',
  [RETRY_LATER]: 'Инстанс запускается. Повторите попытку позже.',
  [RATE_LIMITED]:
    'Слишком много запросов к GREEN-API. Повторите через несколько секунд.',
  [SERVICE_UNAVAILABLE]: 'GREEN-API временно недоступен. Повторите попытку.',
  [INVALID_UPSTREAM_RESPONSE]:
    'Не удалось проверить состояние инстанса. Повторите попытку.',
  [SERVER_UNAVAILABLE]: 'Сервис временно недоступен. Повторите попытку позже.',
} as const
