# Data model 043

| Сущность | Ключ/владелец | Правило |
| --- | --- | --- |
| History request | `historyRequestKey(scope, chatId, accessId)` / TanStack Query | Каждый доступ, в том числе тот же chatId, даёт свежий запрос; одновременные читатели разделяют один queryFn |
| Conversation event | `history`, `accepted`, `delivery` / координатор | Нормализованный источник; внешний DTO и delivery валидированы до применения |
| Message projection | `messageKey(scope, chatId)` / message-cache | Чистый merge 042 сохраняет старые факты, статусы и provenance |
| Early status projection | `(statusFactsKey, scope)` / message-cache | Статус может опередить сообщение; TTL и bound из 042 |
| Session chat projection | `sessionChatKey(scope)` / session-chat-facts | Принятая отправка и неизвестный входящий создают временный чат |
| Unread projection | `unreadKey(scope)` / unread-cache | Только новый входящий ID вне читаемого чата учитывается один раз |
| Issues projection | `(issuesKey, scope)` / message-status-issues | Конфликт фактов публикуется один раз на применение события |

Инвариант доступа: после отмены сигнала, смены accessId или закрытия сессии поздняя история не пишет проекции. Внутри активного доступа live и history сливаются по правилам 042. ACK сетевого уведомления происходит после успешной синхронной операции координатора; `false` означает осознанный пропуск по scope/owner/валидности. Хранение остаётся только в памяти сессии; серверных и дисковых миграций нет.
