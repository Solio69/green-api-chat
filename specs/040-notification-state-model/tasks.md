# Tasks: явная модель состояний уведомлений 040

Input: [spec.md](spec.md), [plan.md](plan.md), [матрица](research.md), [контракт](contracts/connection-state.md). Полный цикл с review/commit/push в `refactor` авторизован.

- [x] T001 Сверить исходный `create-notification-connection.ts`, provider/notice, текущую матрицу status/canSend/issue/pending ACK/recovery/generation; подтвердить baseline `tests/integration/polling-connection.spec.ts`, browser UI и Spec Kit 039 CI.
- [x] T002 Провести read-only анализ spec/checklist/research/plan/data-model/contract/quickstart/tasks и C1–C8, сохранить analysis.md отдельным действием; устранить findings до кода.
- [x] T003 Создать `tests/unit/notification-connection-model.test.ts` с таблицей start/connected/retrying/limited/paused/close, ACK pending/confirmed/expired, outgoing disabled, recovery один раз и stale generation; запустить `npx vitest run --project node tests/unit/notification-connection-model.test.ts` и подтвердить поведенческий Red на минимальном stub (не import/environment failure).
- [x] T004 Реализовать чистый `src/lib/notifications/connection-model.ts` с discriminated union, projection и явной recovery command; добиться Green T003 без fetch/DOM/QueryClient.
- [x] T005 Подключить model к `src/lib/notifications/create-notification-connection.ts`, заменить дублируемые state/canSend/issue/pendingAck/readyOnce/outgoingEnabled/generation источники, сохранить стабильную ссылку snapshot и порядок побочных эффектов. Проверить `tests/integration/polling-connection.spec.ts` Green.
- [x] T006 Добавить `tests/component/notification-notice.test.tsx` для существующих текстов, role и retry; проверить DOM Vitest и затронутые browser Query/E2E; не менять UX без обнаруженного расхождения.
- [x] T007 Провести Refactor и повторный read-only analyze; выполнить typecheck/lint/styles/format, полный Vitest/integration/query/production E2E, проверку client/server graph, ACK/recovery/late events, diff/секреты; записать verification.
- [ ] T008 Провести предкоммитное review, commit/push `refactor`, подтвердить обе GitHub jobs на SHA кода, обновить roadmap/spec/verification и проверить CI итогового документационного SHA.

039 → T001 → T002 → T003 Red → T004 Green → T005 → T006 → T007 Refactor/verification → T008.

| Требование | Задачи |
| --- | --- |
| FR-001 | T001, T003–T005, T007 |
| FR-002 | T003–T005, T007 |
| FR-003 | T001, T003–T007 |
| FR-004 | T001, T003–T005, T007 |
| FR-005 | T001, T003–T007 |
| FR-006 | T001, T003, T005–T007 |
| FR-007 | T003–T008 |
| SC-001 | T003–T008 |
| SC-002 | T001, T003–T008 |
| SC-003 | T001, T003, T005–T008 |

Название коммита: `refactor(notifications): model connection states`. Новых пакетов/серверных контрактов нет.
