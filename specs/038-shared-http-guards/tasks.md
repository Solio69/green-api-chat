# Tasks: общие HTTP-проверки 038

Input: [spec.md](spec.md), [plan.md](plan.md), [матрица](research.md), [contract](contracts/http-guards.md). Полный цикл с review/commit/push в `refactor` авторизован.

- [x] T001 Снять baseline 037 и таблицу действующих Origin/Host, scope, media type, Content-Length, actual bytes, JSON, order и response по каждому целевому handler; оформить research/plan/data-model/contract/quickstart.
- [x] T002 Провести read-only анализ spec/checklist/plan/tasks/матрицы/C1–C8 и сохранить analysis.md отдельным действием. Findings исправить до кода.
- [x] T003 Добавить `tests/integration/shared-http-contract.spec.ts` с независимыми публичными кодами/телами для send/history/notifications/chats/recipient/login и запустить на старых handlers как baseline; не выдавать Passed baseline за Red.
- [x] T004 Добавить `tests/unit/http-guards.test.ts` для strict Origin/Host, scope, media type, bounded stream 65 536/8 192, declared length policy, invalid UTF-8/JSON, cancel/release и no-store. Запустить `npx vitest run --project node tests/unit/http-guards.test.ts`, подтвердить поведенческий Red (не import/environment failure).
- [x] T005 Реализовать `src/server/http/{constants,is-same-origin,read-connection-scope,is-json-media-type,read-json-body,json-no-store,index}.ts`; добиться Green T004, не вводя route-level mapping.
- [x] T006 Перевести `src/lib/sending/{read-send-body,handle-send-request}.ts`, `src/lib/history/handle-history-request.ts`, `src/lib/notifications/handle-notification-request.ts`, `src/lib/chats/handle-chats-request.ts`, `src/lib/recipients/{handle-search-request,resolve-search}.ts`, `src/features/auth/server/handle-login-request.ts` на общие функции; сохранить точный порядок/response и legacy wrapper readSendBody до 054. Повторить integration matrix Green.
- [x] T007 Провести Refactor, повторный read-only analyze, проверить typecheck/lint/style/format, полный Vitest/integration/query/production E2E, server/client graph, matrix, diff и отсутствие реальных секретов; записать verification.
- [x] T008 Провести предкоммитное review, commit/push `refactor`, подтвердить обе GitHub jobs на SHA кода, обновить roadmap/spec/verification и проверить CI итогового документационного SHA.

037 → T001 → T002 → T003 baseline → T004 Red → T005 Green → T006 → T007 Refactor/verification → T008.

| Требование | Задачи |
| --- | --- |
| FR-001 | T001–T003, T007 |
| FR-002 | T003–T007 |
| FR-003 | T003–T007 |
| FR-004 | T001, T003, T006–T007 |
| FR-005 | T003–T007 |
| FR-006 | T003–T007 |
| FR-007 | T003, T006–T008 |
| SC-001 | T001, T003–T008 |
| SC-002 | T003–T008 |
| SC-003 | T003, T006–T008 |

Английское имя коммита: `refactor(http): centralize request guards`. Новых пакетов и действий пользователя нет.
