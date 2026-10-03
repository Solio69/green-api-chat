# Tasks: координатор кеша переписки 043

Input: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [модель](data-model.md), [контракт](contracts/conversation-cache.md). Полный цикл с review/commit/push в `refactor` авторизован.

- [x] T001 Сверить историю, Query/read hooks, send/notification/cache projections и 29/29 targeted integration baseline; зафиксировать вариант queryFn + coordinator и CI 042.
- [x] T002 Провести read-only анализ spec/checklist/research/plan/data-model/contract/quickstart/tasks и C1–C8; сохранить analysis.md отдельным действием, устранить findings до кода.
- [x] T003 Добавить HistoryProbe cache-write probe и `tests/query/history-query.spec.ts` сценарий двух+ потребителей; подтвердить поведенческий Red лишних merge/write на исходном hook. Зафиксировать targeted Query baseline для прочих сценариев.
- [x] T004 Реализовать coordinator и единственное history apply внутри queryFn; удалить per-hook QueryCache subscription/dataUpdateCount. Получить Green T003, проверить cancel/late scope/access, empty/error/refetch.
- [x] T005 Делегировать accepted/notification применение координатору, добавить `tests/integration/conversation-cache-coordinator.spec.ts` для согласованных проекций, replay, invalid scope/owner и apply-before-ACK; сохранить старые adapters. Проверить предварительную валидацию accepted target до записи.
- [x] T006 Refactor и повторный read-only analyze; выполнить typecheck/lint/styles/format, полный Vitest/integration/query/production E2E, client/server graph, `git diff --check`, review секретов; записать verification.md.
- [x] T007 Предкоммитное review точного diff, commit/push `refactor`, обе GitHub jobs на SHA кода, обновить roadmap/spec/verification и подтвердить CI итогового документационного SHA.

042 + 041 → T001 → T002 → T003 Red → T004 Green → T005 → T006 → T007.

| Требование | Задачи |
| --- | --- |
| FR-001 | T001, T004–T006 |
| FR-002 | T003–T006 |
| FR-003 | T001, T005–T006 |
| FR-004 | T003–T006 |
| FR-005 | T001, T003–T006 |
| FR-006 | T003–T006 |
| FR-007 | T001, T005–T006 |
| FR-008 | T003–T006 |
| SC-001 | T003–T007 |
| SC-002 | T003–T007 |
| SC-003 | T001, T005–T007 |

Название коммита: `refactor(conversations): centralize cache application`. Новых пакетов и серверных контрактов нет.
