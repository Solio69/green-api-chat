# Tasks: композиция UI переписки 049

Input: [spec](spec.md), [plan](plan.md), [research](research.md), [model](data-model.md), [contract](contracts/conversation-ui.md), [inventory](inventory.md). Полный цикл/commit/push `refactor` разрешены.

- [x] T001 Сверить все 79 строк карты 049, 7 provider-файлов и прямых потребителей; подтвердить до кода baseline unit/component, integration, Query, E2E по [quickstart](quickstart.md). Сохранить выборку команд и итог в verification.md.
- [x] T002 Провести read-only анализ spec/checklist/research/plan/model/contract/inventory/quickstart/tasks, карты 035 и C1–C8; сохранить отдельный analysis.md с findings, coverage и ссылкой пользователю.
- [x] T003 Добавить регрессию связки `ChatHistoryPanel` в `tests/component/chat-history-panel.test.tsx` либо обоснованно расширить существующую, выполнить на исходном коде: recovery/refetch, loading/error/empty/list; после переноса тест сохраняется. Чистый рефакторинг не требует искусственного Red.
- [x] T004 Перенести `src/lib/conversations/{constants,selection,types}.ts` в `src/features/conversation/selection/model/`, `src/lib/history/{normalize-history,validate-history-request}.ts` в `src/features/conversation/history/model/`; перенести 71 UI-файл из [inventory](inventory.md) и семь файлов `MessageSendProvider`/`NotificationProvider` в `src/features/conversation/ui`; добавить три role-specific entry; в `ChatHistoryPanel` выделить локальный hook; вынести selection/unread из `chats/ui/ChatListPanel` в `conversation/ui/ConversationChatListPanel`, собрать sidebar в `app/page` и передать его в ChatWorkspace props. Обновить все `src`/`tests` импорты и карту 035. Поведение/HTTP не менять.
- [x] T005 Green/Refactor: сверить reducer, history validation/normalization, composer late result, unknown/manual check, recovery, scroll/focus/mobile, status, DOM/ARIA/SCSS; убрать старые UI/selection/history импорты и проверить отсутствие ребра `chats/ui → conversation/ui`. Если обнаружено необходимое поведенческое изменение, сначала отдельно подтвердить тестовый поведенческий Red → реализация → Green → Refactor.
- [x] T006 Выполнить `npm run typecheck`, `npm run lint`, `npm run lint:styles`, `npm run format:check`, `npm run test`, `npm run test:integration`, `npm run test:query`, `npm run test:e2e`, graph/rg/diff/secret review; затем read-only post-analysis и verification.md. При сбое исправить затронутое и повторить соответствующий итоговый набор.
- [ ] T007 Предкоммитное review, commit/push `refactor`, обе CI jobs кодового SHA; обновить roadmap/spec/tasks/verification и проверить обе jobs документационного SHA. Английский кодовый коммит: `refactor(conversation): isolate UI composition`.

## Dependencies & Execution Order

041 + 043 + 044 + 048 → T001 → T002 → T003 → T004 → T005 → T006 → T007. Новая бизнес-логика/серверный контракт не запланированы; при вынужденном изменении TDD вставляется перед кодом. Playwright integration/Query/E2E запускаются последовательно из-за общего `test-results`. Новых пакетов, миграций и действий пользователя нет.

## Coverage

| Требование | Задачи |
| --- | --- |
| FR-001 | T001, T004–T006 |
| FR-002 | T003–T006 |
| FR-003 | T001, T005–T006 |
| FR-004 | T001, T005–T006 |
| FR-005 | T001, T005–T006 |
| FR-006 | T001, T003, T005–T006 |
| FR-007 | T001, T005–T006 |
| FR-008 | T002, T004–T006 |
| SC-001 | T004–T007 |
| SC-002 | T001, T005–T007 |
| SC-003 | T001, T005–T007 |

T002 и T007 обеспечивают обязательную проверяемость и завершение всех требований; задач без связи с приёмкой нет.
