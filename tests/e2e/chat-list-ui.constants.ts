export const CHAT_LIST_UI = {
  API: '**/api/chats',
  SCOPE_HEADER: 'x-connection-scope',
  LIST: 'Личные чаты',
  LOADING: 'Загружаем чаты…',
  EMPTY: 'Пока нет чатов',
  ERROR: 'Не удалось загрузить чаты',
  ERROR_HINT: 'Попробуйте ещё раз.',
  RATE_LIMIT: 'Слишком много запросов',
  RETRY_PENDING: 'Обновляем…',
  REFRESH: 'Обновить',
  MAX_RETRY_LABEL_LINES: 2,
} as const

export const CHAT_LIST_FIXTURES = [
  {
    chatId: 'chat-1',
    name: 'Анна Демо',
    username: '@anna_demo',
    phone: '12025550101',
  },
  {
    chatId: 'chat-2',
    name: null,
    username: '@recipient_demo',
    phone: '12025550102',
  },
  { chatId: 'chat-3', name: null, username: null, phone: '12025550103' },
  { chatId: 'chat-4', name: null, username: null, phone: null },
  { chatId: 'chat-5', name: 'Анна Демо', username: null, phone: null },
  { chatId: 'chat-6', name: '<b>Получатель</b>', username: null, phone: null },
]
