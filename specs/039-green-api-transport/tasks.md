# Tasks: общий транспорт GREEN-API 039

Input: [spec.md](spec.md), [plan.md](plan.md), [матрица](research.md), [contract](contracts/transport.md). Полный цикл с review/commit/push в `refactor` авторизован.

- [x] T001 Сверить 038 CI, исходные `src/lib/green-api/*` и семь групп integration-тестов; зафиксировать в research различия URL/method/JSON/signal/retry/status и исходный Passed baseline без кода.
- [x] T002 Провести read-only анализ spec/checklist/plan/tasks/матрицы/C1–C8 и сохранить analysis.md отдельным действием. Исправить технические findings отдельно до кода.
- [x] T003 Создать `tests/unit/green-api-transport.test.ts` для URL с кодированием credentials, GET/POST/DELETE, JSON body, no-store/redirect, raw Response, fetch error, ровно одного вызова и использования переданного signal. Запустить `npx vitest run --project node tests/unit/green-api-transport.test.ts` и подтвердить поведенческий Red на минимальном stub (не import/environment failure).
- [x] T004 Реализовать `src/lib/green-api/transport.ts` без классификации/timeout/retry и добиться Green T003.
- [x] T005 Перевести `src/lib/green-api/{get-state,get-account-settings,get-chats,get-chat-history,check-account}.ts` на transport, сохранив порядок и количество повторов, отмену тела 429 только там, где она есть, сигналы и публичные результаты. Запустить целевые integration-тесты.
- [x] T006 Перевести `src/lib/green-api/{send-message,notification-request}.ts`, а через последний settings/receive/delete; сохранить deadline-only после dispatch и zero retry у SendMessage, parsing Retry-After и Delete false. Запустить целевые integration-тесты.
- [x] T007 Провести Refactor и повторный read-only analyze; выполнить typecheck/lint/styles/format, полный Vitest/integration/query/production E2E, server/client graph, diff и secret review; записать verification.
- [x] T008 Провести предкоммитное review, commit/push `refactor`, подтвердить обе GitHub jobs на SHA кода, обновить roadmap/spec/verification и проверить CI итогового документационного SHA.

038 → T001 → T002 → T003 Red → T004 Green → T005 → T006 → T007 Refactor/verification → T008.

| Требование | Задачи |
| --- | --- |
| FR-001 | T001, T003–T007 |
| FR-002 | T001, T005–T007 |
| FR-003 | T001, T003, T005–T007 |
| FR-004 | T001, T003, T005–T007 |
| FR-005 | T001, T006–T007 |
| FR-006 | T001, T003, T005–T007 |
| FR-007 | T005–T008 |
| SC-001 | T001, T003–T008 |
| SC-002 | T001, T005–T008 |
| SC-003 | T003–T008 |

Название коммита: `refactor(green-api): centralize transport`. Новых пакетов и реальных запросов к провайдеру нет.
