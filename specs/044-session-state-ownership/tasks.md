# Tasks: владение памятью подключения 044

Input: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [модель](data-model.md), [контракт](contracts/session-ownership.md). Полный цикл с review/commit/push в `refactor` авторизован.

- [x] T001 Сверить QuerySession, chat query options, memory prefixes, provider/selection/unread и baseline 043; выполнить targeted chat/session/memory/cleanup проверки, собрать карту вызовов `session.options()` и CI 043.
- [x] T002 Провести read-only анализ spec/checklist/research/plan/data-model/contract/quickstart/tasks и C1–C8; отдельно записать analysis.md, устранить findings до кода.
- [x] T003 Добавить проверку generic QuerySession без feature defaults и composition с точными memory defaults, scope key и close/late response. Для чистого переноса использовать baseline; не создавать искусственный Red.
- [x] T004 Вынести `chatsQueryOptions` и `configureConnectionMemory`/`createConnectionSession`; удалить feature imports и `options()` из generic core, подключить QueryProvider/useChats/notification refresh. Обновить существующие тестовые вызовы на явного владельца.
- [x] T005 Проверить матрицу GC/stale, memory retention и cleanup errors, scope A→B, unread seen/replay/hidden panel, selection access/epoch, StrictMode; исправить только обнаруженные регрессии без изменения продуктовых правил.
- [x] T006 Refactor и повторный read-only analyze; typecheck/lint/styles/format, полный Vitest/integration/query/production E2E, client/server graph, `git diff --check`, секреты; записать verification.md.
- [x] T007 Предкоммитное review точного diff, commit/push `refactor`, обе GitHub jobs на SHA кода, обновить roadmap/spec/verification и подтвердить CI итогового документационного SHA.

043 + 037 → T001 → T002 → T003–T004 → T005 → T006 → T007.

| Требование | Задачи |
| --- | --- |
| FR-001 | T001, T003–T006 |
| FR-002 | T001, T003–T006 |
| FR-003 | T001, T003–T006 |
| FR-004 | T001, T003–T006 |
| FR-005 | T001, T005–T006 |
| FR-006 | T001, T005–T006 |
| FR-007 | T003–T006 |
| FR-008 | T001, T005–T006 |
| SC-001 | T003–T007 |
| SC-002 | T001, T003–T007 |
| SC-003 | T001, T005–T007 |

Название коммита: `refactor(query): separate session memory owners`. Новых пакетов и серверных контрактов нет.
