# Tasks: модуль поиска получателя 046

Input: [spec](spec.md), [plan](plan.md), [research](research.md), [model](data-model.md), [contract](contracts/recipient-search.md). Цикл/commit/push refactor авторизованы.

- [x] T001 Сверить форму, пять UI-компонентов, model/server фактические зависимости, карту 035 и baseline 7/7 integration, 10/10 browser; зафиксировать вариант/риски.
- [x] T002 Провести read-only analyze spec/checklist/research/plan/data-model/contract/quickstart/tasks, C1–C8 и CSV; записать analysis.md отдельным действием, устранить findings.
- [x] T003 Добавить tests/unit/recipient-search-client.test.ts и tests/component/recipient-search-form.test.tsx, включая unmount/abort; подтвердить поведенческий Red до реализации новой защиты.
- [x] T004 Перенести parser/format/constants в features/recipients/model и server handler/response в server, UI компонентов в ui, добавить browser adapter/hook, публичные входы; обновить route, consumers, tests и две фактически ошибочные строки CSV; выполнить Green.
- [x] T005 Refactor: проверить оба режима, границы, pending/retry, 401/close, stale response, подпись/выбор, клавиатуру/адаптивность и отсутствие отправки.
- [x] T006 Повторный read-only analyze, typecheck/lint/styles/format, полный Vitest/integration/Query/E2E, server/client graph, diff/secret review; записать verification.md.
- [x] T007 Предкоммитное review, commit/push refactor, обе GitHub CI jobs на кодовом SHA; обновить roadmap/spec/verification и подтвердить CI документационного SHA.

035 + 038 + 030 → T001 → T002 → T003 Red → T004 Green → T005 Refactor → T006 → T007.

| Требование | Задачи |
| --- | --- |
| FR-001 | T001, T003–T006 |
| FR-002 | T001, T003–T006 |
| FR-003 | T001, T003–T006 |
| FR-004 | T003–T006 |
| FR-005 | T001, T003–T006 |
| FR-006 | T001, T003–T006 |
| FR-007 | T001, T003–T006 |
| SC-001 | T003–T007 |
| SC-002 | T003–T007 |
| SC-003 | T003–T007 |

Название коммита: refactor(recipients): separate search model and UI.
