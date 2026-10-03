# Tasks: чистая модель сообщений и статусов 042

Input: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [модель](data-model.md), [контракт](contracts/message-facts.md). Полный цикл с review/commit/push в `refactor` авторизован.

- [x] T001 Сверить `merge-message-facts.ts`, DTO/валидаторы/normalizers и 26/26 targeted baseline `history-query`, `message-cache`, `message-statuses`; зафиксировать source/status/TTL/limit/identity матрицу и CI 041.
- [x] T002 Провести read-only анализ spec/checklist/research/plan/data-model/contract/quickstart/tasks и C1–C8; сохранить analysis.md отдельным действием, устранить findings до кода.
- [x] T003 Добавить `tests/unit/message-domain.test.ts`: один idMessage в разных chatId, accepted/history/live precedence, read/failed conflict, early TTL/limit и отсутствие мутаций. Сначала запустить коллизию на текущем `mergeMessageFacts` и подтвердить поведенческий Red; остальные проверки фиксируют действующий контракт.
- [x] T004 В `src/lib/messages/types.ts`, `merge-message-facts.ts` и при необходимости `validate-message.ts` ввести DTO/fact/view границу, source-tagged канонический merge, составной identity и совместимый adapter. Получить Green T003 без React/QueryClient и без изменения публичного DTO.
- [x] T005 Убрать небезопасные `!`/casts в обработке ранних статусов и `normalize-message-status.ts` через явные guards. Проверить targeted 26 integration, атомарную валидацию cache и независимость чатов; не переносить Query orchestration 043.
- [x] T006 Провести Refactor и повторный read-only analyze; выполнить typecheck/lint/styles/format, полный Vitest/integration/query/production E2E, client/server graph, `git diff --check`, отсутствие мутаций и секретов; записать verification.md.
- [ ] T007 Предкоммитное review точного diff, commit/push `refactor`, обе GitHub jobs на SHA кода, обновить roadmap/spec/verification и подтвердить CI итогового документационного SHA.

041 → T001 → T002 → T003 Red → T004 Green → T005 → T006 Refactor/verification → T007.

| Требование | Задачи |
| --- | --- |
| FR-001 | T001, T003–T006 |
| FR-002 | T001, T003–T006 |
| FR-003 | T001, T003–T006 |
| FR-004 | T001, T003–T006 |
| FR-005 | T001, T003–T006 |
| FR-006 | T003–T006 |
| FR-007 | T003–T006 |
| SC-001 | T003–T007 |
| SC-002 | T001, T003–T007 |
| SC-003 | T003–T007 |

Название коммита: `refactor(messages): separate validated facts`. Новых пакетов, серверных API и UI-состояний нет.
