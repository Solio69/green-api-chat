# Контракт уведомлений: http

Действующий полный контракт: [027 notification-http](../../027-vercel-notification-polling/contracts/notification-http.md).
Используется последовательный HTTP polling с JSON и отдельным подписанным ACK,
без SSE, claim/release и процессного registry. Применение Query/skip/dedup и
восстановление истории сохраняются. Вкладки координирует Web Locks только
в одном браузере на одном origin/connectionScope. Server-wide owner/send lease
не заявлены; cookie/Origin/scope защищают каждый серверный запрос.
