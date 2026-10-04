# Tasks: сетевой цикл и жизненный цикл уведомлений 041

Input: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [модель](data-model.md), [контракт](contracts/notification-cycle.md). Полный цикл с review/commit/push в `refactor` уже авторизован.

- [x] T001 Сверить исходный `create-notification-connection.ts`, transport/lease/refresh, контракт 027, polling 15/15 и RTL lifecycle 8/8; зафиксировать timing/ACK/close/recovery baseline и CI 040.
- [x] T002 Провести read-only анализ spec/checklist/research/plan/data-model/contract/quickstart/tasks и C1–C8; отдельно записать analysis.md, устранить findings до кода.
- [x] T003 Написать `tests/unit/notification-cycle.test.ts` на controlled post/wait/random/active для ACK proof, delivery-before-ACK, retry delay/Retry-After и late close; создать минимальный импортируемый stub нового runtime; подтвердить поведенческий Red через `npx vitest run --project node tests/unit/notification-cycle.test.ts`.
- [x] T004 Реализовать `src/lib/notifications/run-notification-cycle.ts`, Green T003 и явные ports без React/lease/Query подписчиков. Инъецировать `now` в `notification-transport.ts`/`refresh-notification-chats.ts`; тест для HTTP-date Retry-After до изменения, затем Green.
- [x] T005 Подключить runtime к `src/lib/notifications/create-notification-connection.ts`, оставить в контроллере lease/owner/generation/abort/retain/subscribers и прежний публичный контракт. Выполнить targeted polling и RTL lifecycle, дополнить только реальные пробелы по settings/receive/ACK close и late lease; проверить throttle/cleanup refresh в `tests/unit/notification-chat-refresh.test.ts`.
- [x] T006 Провести Refactor и повторный read-only analyze; выполнить typecheck/lint/styles/format, полный Vitest/integration/query/production E2E последовательно для Playwright, client/server graph, `git diff --check`, ACK/recovery/тайминги и review секретов; записать verification.md.
- [x] T007 Предкоммитное review точного diff, commit/push `refactor`, обе GitHub jobs на SHA кода, обновить roadmap/spec/verification и подтвердить CI итогового документационного SHA.

040 → T001 → T002 → T003 Red → T004 Green → T005 → T006 Refactor/verification → T007.

| Требование | Задачи |
| --- | --- |
| FR-001 | T001, T003–T006 |
| FR-002 | T001, T003–T006 |
| FR-003 | T001, T003–T006 |
| FR-004 | T001, T003–T006 |
| FR-005 | T001, T005–T006 |
| FR-006 | T003–T006 |
| FR-007 | T001, T003–T006 |
| FR-008 | T001, T005–T006 |
| SC-001 | T003–T007 |
| SC-002 | T001, T003–T007 |
| SC-003 | T001, T005–T007 |

Название коммита: `refactor(notifications): separate polling runtime`. Новых пакетов и серверных контрактов нет.
