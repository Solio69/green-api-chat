export const CHAT_LIST_ERROR_COPY = {
  GENERIC: {
    TITLE: 'Не удалось загрузить чаты',
    DESCRIPTION: 'Попробуйте ещё раз.',
  },
  RATE_LIMIT: {
    TITLE: 'Слишком много запросов',
    DESCRIPTION: 'Попробуйте позже.',
  },
} as const

export const CHAT_LIST_RECOVERY_COPY = {
  RETRY: 'Обновить',
  RETRY_PENDING: 'Обновляем…',
} as const
