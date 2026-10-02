# Implementation Plan: история выбранного чата и кеш

**Spec**: [spec.md](spec.md). **Дата**: 2026-10-02.
**User Approval**: Согласована 2026-10-02 в составе 018–025.
**Code Authorization**: разрешено пользователем 2026-10-02: обновить документы и реализовать отображение истории строго по макету.

## Summary

После 025 и 018 подключить читаемую историю к существующему conversation slot,
сохранять merged сообщения в Query и подготовить общие producers helpers для
следующих 023/021. Сеть остаётся 018 count: 10; UI/header/выбор 025 не переписываются.
Галочки и статусные ошибки показывает 024, но memory foundation создаёт 019.

## Considered Options and Context

[Research](research.md) фиксирует варианты, источники и решения. Стек и
инструменты существующие: Next 16.3.7/React 19.3.0/Query 5.104.0/Playwright.
Своей БД, persist storage, новых dependencies и изменения тарифов нет.
Серверный page может передать ReactNode, а status callback подключится только
в client MessageList 024. Удержание сообщений/overlay обосновано retention,
не меняет Query policy списка 014. Не вводим pagination/count: 20.

## Constitution Check

| Принцип | Результат | Основание                                                                |
| ------- | --------- | ------------------------------------------------------------------------ |
| C1      | PASS      | Пользователь согласовала spec, технические вопросы сверены координатором |
| C2      | PASS      | Отдельный шаг отображения/core, без реальной очереди/отправки            |
| C3      | PASS      | Полный analyze и отдельная авторизация предшествуют коду                 |
| C4      | PASS      | Git read-only; staging пользователя сохраняется                          |
| C5      | PASS      | Пакеты/данные/миграции не меняются                                       |
| C6      | PASS      | Явный выбор 019, fiction fixtures, scope guards                          |
| C7      | PASS      | Последовательный Red→Green→Refactor; verification Passed isolated        |
| C8      | PASS      | Один Query cache, существующий макет и тестовые инструменты              |

## Design

- [Модель](data-model.md), [message-cache](contracts/message-cache.md), [session-overlay](contracts/session-chat-overlay.md), [UI](contracts/history-view.md), [quickstart](quickstart.md).
- [History 018](../018-chat-history-console/contracts/history-query.md), [selection 025](../025-conversation-selection/contracts/conversation-selection.md), [общий индекс](../../docs/messaging-specs.md).
- Порядок реализации: 025 → 018 → 019 → 022 → 023 → 020 → 021 → 024. Это техническая зависимость, не разрешение выполнить эпик сразу.

## Project Structure — перечень файлов реализации

| Файл                                                              | Действие                                                                              |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| src/lib/messages/types.ts                                         | Расширить созданные 018 типы ранних фактов/issues/apply result                        |
| src/lib/messages/constants.ts                                     | Prefix defaults/TTL 300000/max 1000/keys                                              |
| src/lib/messages/merge-message-facts.ts                           | Все sources, pure status progression и issue result                                   |
| src/lib/messages/message-cache.ts                                 | applyMessageFacts/addAcceptedMessage, guarded batch/GC/присоединение раннего факта    |
| src/lib/messages/use-conversation-messages.ts                     | Read-only подписка merged Query                                                       |
| src/lib/messages/message-status-issues.ts                         | Общая публикация latest scoped issues без bubble                                      |
| src/lib/messages/use-message-issues.ts                            | Read-only issue hook для 024                                                          |
| src/lib/history/use-chat-history.ts                               | Публиковать returned issues после текущего history merge через helper 019             |
| src/lib/chats/session-chat-facts.ts                               | remember/reconcile overlay и отдельные labels                                         |
| src/lib/chats/use-session-chat-labels.ts                          | Read-only fallback labels                                                             |
| src/lib/chats/use-chats.ts                                        | Derived union, public PersonalChat[] сохраняется                                      |
| src/lib/query/create-query-session.ts                             | Defaults до first write; GetChats success reconcile; политика 014 прежняя             |
| src/components/ChatList/ChatList.tsx                              | Optional labelsByChatId, существующая строка/выбор 025                                |
| src/components/ChatListPanel/ChatListPanel.tsx                    | Передать labels hook; при ошибке сохранить известный union рядом с прежним error card |
| src/components/ChatHistoryPanel/ChatHistoryPanel.tsx              | История/состояния/ручной повтор                                                       |
| src/components/ChatHistoryPanel/index.ts                          | Public export                                                                         |
| src/components/ChatHistoryPanel/constants.ts                      | Согласованные подписи                                                                 |
| src/components/ChatHistoryPanel/ChatHistoryPanel.module.scss      | Существующий макет без редизайна                                                      |
| src/components/MessageList/MessageList.tsx                        | Scroll/container/keys/status slot                                                     |
| src/components/MessageList/index.ts                               | Public export                                                                         |
| src/components/MessageList/constants.ts                           | Семантические константы, только если необходимы измерению                             |
| src/components/MessageList/MessageList.module.scss                | Scroll тела, без pagination                                                           |
| src/components/MessageBubble/MessageBubble.tsx                    | Direction/text/known time/unsupported, optional status                                |
| src/components/MessageBubble/index.ts                             | Public export                                                                         |
| src/components/MessageBubble/constants.ts                         | Placeholder/copy                                                                      |
| src/components/MessageBubble/MessageBubble.module.scss            | Existing left/right bubbles/word wrap                                                 |
| src/app/page.tsx                                                  | Conversation ReactNode slot                                                           |
| tests/history/constants.ts                                        | Общие фиктивные сценарии с 018                                                        |
| tests/integration/message-cache.spec.ts                           | Merge/early TTL/overflow/issues/active guards                                         |
| tests/integration/session-chat-facts.spec.ts                      | Overlay/reconcile/labels/GC                                                           |
| tests/integration/chat-query.spec.ts                              | Regression 014 policy/lifecycle                                                       |
| tests/query/history-window.spec.ts                                | Hooks/fixtures rendering/cache races                                                  |
| tests/query/session-chat-overlay.spec.ts                          | Derived chat rows without fake profile                                                |
| tests/fixtures/query-app/components/HistoryProbe/HistoryProbe.tsx | Дополнить существующий 018 probe настоящими history components                        |
| tests/fixtures/query-app/app/page.tsx                             | Fixture integration без нарушения 025/014                                             |
| tests/e2e/history-window.spec.ts                                  | Cookie/wiring/desktop-mobile/text safety                                              |
| specs/019-chat-history-window/verification.md                     | Только фактический отчёт после реализации                                             |

Docs: spec.md, plan.md, research.md, data-model.md, contracts/message-cache.md,
contracts/session-chat-overlay.md, contracts/history-view.md, quickstart.md,
tasks.md, checklists/requirements.md, checklists/acceptance.md. analysis.md
создаёт координатор отдельным действием после полного read-only прохода.
Фактический verification.md содержит Red/Green и результаты итоговых проверок, без утверждения выполненного T011.

Дополнение manifest: src/components/ChatListItem/ChatListItem.tsx получает optional fallbackLabel; выбор подписи остаётся в нём. ChatHistoryState/{ChatHistoryState.tsx,index.ts,constants.ts,ChatHistoryState.module.scss} выделяет загрузку, пустоту и ошибку по самостоятельной роли. Эти компоненты входят T008–T010. 018 уже содержит минимальное ядро и guards; 019 расширяет их без новой сети.

Дополнения фактического manifest:

| Файл                                                                                      | Роль                                                                  |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| src/lib/chats/constants.ts                                                                | Константы ключа и источников session overlay                          |
| src/components/MessageList/use-message-scroll.ts                                          | Частный хук измерения и сохранения позиции                            |
| src/styles/_tokens.scss, src/styles/_theme.scss                                           | Размеры и цвета пузырей из утверждённого макета                       |
| tests/chats/session-constants.ts                                                          | Независимые фикстуры overlay                                          |
| tests/fixtures/query-app/components/HistoryFactsProbe/HistoryFactsProbe.tsx, index.ts     | Управляемые факты общего ядра в Query-тестах                          |
| tests/fixtures/query-app/components/SessionOverlayProbe/SessionOverlayProbe.tsx, index.ts | Потребитель настоящего overlay helper                                 |
| tests/query/chat-query.spec.ts                                                            | Известный список сохраняется рядом с ошибкой; pending-подпись повтора |
| tests/e2e/history-api.spec.ts                                                             | Свежие запросы и отображение без отладочных логов                     |
| tests/e2e/conversation-selection.spec.ts                                                  | Успешная пустая история найденного получателя                         |

`MessageCache.contentSources` — необязательные метаданные источника в той же
записи Query, сохраняющие live-текст при поздней истории даже без timestamp.
DTO и публичные signatures производителей не меняются. Для memory-префиксов
отключён structuralSharing: установленный Query deep replace теряет собственный
ключ `__proto__` при повторной записи Record. Неизменяемое слияние контролируется
нашим reducer; сетевые defaults списка 014 сохраняются.

## Dependencies and TDD

T001 актуальность/authorization → T002 RED core → T003 GREEN core → T004
REFACTOR → T005 RED overlay → T006 GREEN → T007 REFACTOR → T008 RED UI →
T009 GREEN → T010 REFACTOR → T011 conditional integrated acceptance после
023/021/024 → T012 проверки → T013 review → T014 фактическая verification.
Ни одна Green не предшествует подтверждённому поведенческому Red.
T011 в изоляции помечается NotRunExternal и не выдается за Passed; isolated
core fixtures уже проверяются T002–T010. После внешней реализации выполнить
оставшееся до полного SC-005. Отправку/очередь 019 не создаёт ради проверки.

## Verification

Core: identity/races/monotonic/early fact/TTL/overflow/close; overlay: accepted,
incoming, empty/error/confirmed provider и отсутствие fake name; UI: states,
safe text, wrap, unsupported, counts>10/без сетевой подгрузки при прокрутке, desktop/mobile/back/close.
Команды и результаты — [quickstart](quickstart.md) и [verification](verification.md).
Изолированная реализация Passed: 211 integration, 23 Query, 28 целевых E2E; сборка, typecheck, lint/styles/format Passed. T011/SC-005 остаётся NotRunExternal. Реальные токены и переписка не использовались.

## Post-design Constitution Check / Complexity

C1–C8 PASS по тем же основаниям. Сверенная координатором общая модель создаётся
до реальных производителей событий. Три дополнительных ключа Query нужны для
ранних статусов, последних ошибок и overlay текущей сессии; постоянное
хранилище не добавляется. Ранние факты ограничены TTL и размером, основная
история удерживается до закрытия подключения без скрытого лимита.

## Исправление по ревью консоли

Memory Query defaults используют queryFn: skipToken — штатное обозначение
записи без загрузчика. enabled:false отдельно не устраняет предупреждение
useBaseQuery в development. Сеть GetChats/history остаётся прежней; чтение кеша
и его обновление через setQueryData сохраняются. Фиктивный queryFn, фильтр console
или возврат искусственного [] не добавлены.

ChatHistoryController/{ChatHistoryController.tsx,constants.ts,index.ts} удалён;
его импорты и fixture mounts убраны. Потребители Query и ChatHistoryPanel продолжают
читать историю. tests/integration/memory-query.spec.ts проверяет настоящий React
useQuery в development через SSR и отсутствие console errors для четырёх ключей.
History Query/E2E проверяют состояние/запросы и отсутствие отладочного вывода.
Будущий recovery023 подключается к существующему ChatHistoryPanel в SelectionProvider;
его manifest/tasks/client contract актуализированы без реализации023.
