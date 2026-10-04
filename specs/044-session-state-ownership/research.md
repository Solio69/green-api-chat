# Research 044: владение памятью подключения

Дата: 2026-10-03. Исходники: `create-query-session.ts`, `use-chats.ts`, QueryProvider, `refresh-notification-chats.ts`, message/early/issues/session-chat/unread caches, selection provider; baseline 043: 58 Vitest, 366 integration, 46 Query и 110 E2E локально. CI 043 учитывается отдельно. Пакетов и форматов данных не добавляем.

## Наблюдаемое состояние

`createQuerySession` уже владеет QueryClient, active/close, cleanup isolation и Strict Mode retain/release. Однако он импортирует `fetchChats`, `reconcileSessionChats`, CHAT_QUERY_CONFIG и пять ключей проекций переписки. Метод `session.options()` строит именно запрос списка чатов. Поэтому общий Query lifecycle знает функции конкретного модуля; `useChats` и notification refresh вызывают этот метод. Сообщения, ранние статусы, issues, временные чаты и unread используют QueryClient текущего подключения; ключи включают connectionScope, gcTime Infinity и clear() на close. `seenByChatId` сохраняет уже увиденные ID после очистки unread в пределах подключения; при новой сессии очищается вместе с кешем. Выбор хранится в provider, привязанном к подключению, accessId отличается от selectionEpoch.

## Варианты

| Вариант | Плюсы | Риски/цена | Решение |
| --- | --- | --- | --- |
| Вынести chat query options и конфигурацию memory defaults к владельцам функций; общий session оставить только с lifecycle/ошибкой/QueryClient, соединить в отдельном composition factory | Явные зависимости, проверяемая граница, прежний QueryClient и ключи | Нужно обновить потребителей `session.options()` и тесты, которые предполагали автоматическую feature-конфигурацию в core | Выбран |
| Сохранить `createQuerySession` фасадом над новым generic core | Меньше изменений импортов | Сам публичный Query-модуль продолжит импортировать feature-код и скрывать владение | Отклонён |
| Ввести отдельный store для сообщений/unread | Потенциально независимая память | Дублирует TanStack Query, усложняет синхронизацию и cleanup без продуктовой нужды | Отклонён |

`createQuerySession` сохраняет generic lifecycle, QueryCache session-error handling, callback cleanup и публичный тип `QuerySession`; `fetcher` остаётся как необязательная транспортная зависимость для chat options, без feature-импорта. `chatsQueryOptions(session)` переносит staleTime 60 s, gcTime 300 s, key, fetch/reconcile и refetch policy. `configureConnectionMemory(session.client)` ставит прежние memory defaults для пяти projection prefixes. `createConnectionSession` связывает core и конфигурацию, вызывается QueryProvider; тесты конкретных feature-кешей выбирают эту composition явно. Ключи не меняются, миграции данных нет. Read hooks продолжают подписываться на собственные проекции; новое хранилище не вводится.
