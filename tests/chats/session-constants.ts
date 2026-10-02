export const SESSION_CHAT_TEST = {
  KEY: 'session-chats',
  LABEL: 'Сеансовый чат',
  PROVIDER_NAME: 'Подтверждённое имя',
  ADD: 'Добавить принятый чат',
  REFRESH: 'Обновить чаты сеанса',
  OUTPUT: 'session-chat-data',
  PATH: '/?overlay=1',
  API: '/api/chats',
  PROTOTYPE_ID: '__proto__',
  SOURCE: { ACCEPTED: 'accepted', INCOMING: 'incoming' },
} as const
