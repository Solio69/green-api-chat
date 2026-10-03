export const NOTIFICATION_NOTICE_COPY = {
  LOCK_UNAVAILABLE:
    'Браузер не поддерживает работу с единственной вкладкой. Откройте приложение в современном браузере по HTTPS.',
  LIMIT: 'Рабочий чат уже открыт в другой вкладке.',
  PAUSE:
    'Получение уведомлений приостановлено. Проверьте настройки GREEN-API: incomingWebhook включён, webhookUrl пустой.',
  INVALID:
    'Получено некорректное уведомление. Оно не удалено из очереди; получение приостановлено.',
  RETRY: 'Подключиться снова',
  RECONNECTING: 'Соединение восстанавливается. Отправка временно недоступна.',
  SETTINGS:
    'Статусы отправки могут не поступать. Включите outgoingMessageWebhook, outgoingAPIMessageWebhook и outgoingWebhook в настройках GREEN-API.',
} as const
