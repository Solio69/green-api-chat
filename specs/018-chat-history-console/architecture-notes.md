# Архитектура истории и получения

Приложение Next.js размещается на Vercel. Cookie-сессия хранит зашифрованные
реквизиты; серверные функции получают их при каждом вызове. Query хранит только
временную клиентскую переписку. История018/019 — свежий GetChatHistory count10
при каждом обращении, объединение известных фактов без дублей, без пагинации.

Получение: browser POST → Next.js → ReceiveNotification(timeout5) → JSON →
применение/skip в Query → ACK с signed proof → DeleteNotification. Серверные
экземпляры независимы; постоянный процесс, SSE/registry, Redis и БД не нужны.
Web Locks ограничивает одну рабочую вкладку на origin/connectionScope в одном
браузере, без глобальной координации устройств. Без вкладки новые запросы
останавливаются. Отправка одна за раз в текущей вкладке без автоматического повтора.

Точные гарантии, ограничения и таймауты определяет
[027](../027-vercel-notification-polling/spec.md),
[HTTP](../027-vercel-notification-polling/contracts/notification-http.md),
[client](../027-vercel-notification-polling/contracts/notification-client.md).
