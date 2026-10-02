export const NOTIFICATION_NOTICE_COPY = {
  LIMIT: 'Рабочий чат уже открыт в другой вкладке.',
  PAUSE:
    'Получение уведомлений приостановлено. Проверьте настройки GREEN-API: incomingWebhook включён, webhookUrl пустой.',
  INVALID:
    'Получено некорректное уведомление. Оно не удалено из очереди; получение приостановлено.',
  DELETE_FAILED:
    'Не удалось подтвердить удаление уведомления. Получение приостановлено; можно подключиться снова.',
  RETRY: 'Подключиться снова',
  RECONNECTING: 'Соединение восстанавливается. Отправка временно недоступна.',
  SETTINGS:
    'Статусы отправки могут не поступать. Включите outgoingMessageWebhook, outgoingAPIMessageWebhook и outgoingWebhook в настройках GREEN-API.',
} as const
