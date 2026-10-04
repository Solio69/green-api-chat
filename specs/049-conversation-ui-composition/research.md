# Research 049 — композиция UI переписки

## Факты проекта

- `src/components` содержит 83 файла: 71 файл компонентов назначен 049, семь файлов `MessageSendProvider`/`NotificationProvider` физически остаются там после логических 043/041, ещё пять принадлежат `QueryProvider` и общему `SubmitButton`.
- `MessageComposer/use-message-composer.ts`, `MessageList/use-message-scroll.ts`, `ChatWorkspace/use-workspace-focus.ts` уже отделяют существенное поведение от разметки. `ChatHistoryPanel.tsx` всё ещё одновременно подписывается на recovery, выбирает состояние и рендерит его.
- Selection reducer находится в `lib/conversations`; нормализатор/валидатор истории в `lib/history`. Их точные строки назначения 049 приведены в [inventory](inventory.md).
- QueryProvider использует `createConnectionSession` из conversation. Прямой перенос в `shared/query` создал бы зависимость shared→feature и нарушил целевой граф. Его публичный переходный вход остаётся до архитектурного завершения 054.
- Текущие тесты покрывают поздний send, unknown, IME, выбор, scroll, мобильный focus, статусы и polling. До кода запускаются целевые группы, после — весь набор. Никаких новых пакетов и сетевых provider-запросов не нужно.

## Варианты

| Вариант | Польза | Риск и цена | Выбор |
| --- | --- | --- | --- |
| A. Перенести компоненты и два provider по роли; сохранить hooks и контракты, вынести лишь связку истории из JSX | Проверяемая граница feature при минимальном риске поведенческих изменений; уже существующие тесты остаются опорой | Массовая смена импортов, нужен полный browser regression | Да |
| B. Переписать всю отправку, историю и уведомления вместе с UI | Немедленно устранит больше переходных путей | Смешает структурный перенос с новым поведением, усложнит локализацию регрессий и Red | Нет; сервер/кеш уже согласованы в 039–044 |
| C. Перенести только JSX, оставить provider и selection в `components/lib` | Малый diff | Циклы и глобальные зависимости сохранятся, FR-001/008 не выполнены | Нет |

## Решения и риски

1. `conversation/ui` экспортирует только UI и UI-hooks; внутренние компоненты используют локальные entry, внешние — публичный entry. Selection model — `conversation/selection/model`, два чистых history файла — `conversation/history/model` с роль-специфичными индексами.
2. `ChatHistoryPanel` получает локальный hook композиции: recovery subscription, данные истории/сообщений/ошибок, `LOADING/REFRESHING/EMPTY/ERROR`. Разметка остаётся прежней. Остальные простые строки не оборачиваются в hooks ради формы.
3. `MessageSendProvider` и `NotificationProvider` переносятся вместе с UI в 049 как физическое завершение 043/041; публичный QueryProvider остаётся доступным по старому пути до 054, без переноса в shared с обратной зависимостью.
4. `ChatListPanel` больше не читает selection/unread из conversation: получает `selectedChatId`, `onSelect` и counts через props. Клиентский адаптер `conversation/ui/ConversationChatListPanel` читает эти состояния и передаёт в chats; `app/page.tsx` собирает `ChatSidebar` и передаёт его как ReactNode в `ChatWorkspace`. Так `conversation/ui → chats/ui` остаётся односторонней связью, а список не импортирует UI переписки.
5. Исходные значения selection, request validation, credential filtering и DOM/ARIA не меняются. В `normalizeHistory` server-only type заменяется структурным типом credentials, как в 048; runtime логика не меняется.
6. Если вскроется поведенческий дефект, не маскировать его переносом: сначала зафиксировать и согласовать изменение, затем поведенческий Red → Green → Refactor. Отдельных зависимостей, БД, фоновой очереди и редизайна нет.
