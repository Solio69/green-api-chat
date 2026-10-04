# Research: фоновое восстановление

Проверено 2026-10-04 по локальному коду.

| Факт | Источник | Следствие |
| --- | --- | --- |
| NotificationNotice отображает limited/paused и проблему настроек исходящих уведомлений, но не retrying | src/features/conversation/ui/NotificationNotice/NotificationNotice.tsx | Временное восстановление не добавляет блок в layout |
| Неуспех цикла даёт temporary_failure, успех — cycle_succeeded | src/features/conversation/notifications/application/run-notification-cycle.ts | Фоновое восстановление и ACK продолжают работать |
| canSend при retrying зависит от everConnected; UI и контроллер отправки читают эту проекцию | connection-model.ts, use-message-composer.ts, MessageSendProvider.tsx | Отдельная отправка доступна после первого успешного подключения |
| everConnected хранит успешную проверку settings | connection-model.ts | Можно сохранить блокировку до первого подключения |
| Отправка отдельным POST, useMutation retry=false, есть pending и unknown | sending/application, MessageSendProvider | Очередь и новый механизм повторов не нужны |
| Временный сбой не снимает Web Lock | create-notification-connection.ts | Проверки владельца и сессии сохраняются |
| Основной tsconfig исключает `tests/component`; Vitest tsconfig включает их вместе с `tests/setup/dom.ts` | tsconfig.json, tsconfig.vitest.json, tests/tsconfig.json | Отдельный `tests/tsconfig.json` даёт редактору стандартный корень тестового TypeScript-проекта без изменения сборки приложения |

Выбран обычный запрос отправки; ожидание восстановления и компактный статус отклонены пользователем. Внешних изменчивых фактов для решения не требуется: используется существующий локальный контракт, библиотеки не меняются.

Причина реального сбоя неизвестна. Общий retry_later может означать разные транспортные ошибки; по скриншоту нельзя назвать Vercel, таймаут или лимит установленной причиной.
