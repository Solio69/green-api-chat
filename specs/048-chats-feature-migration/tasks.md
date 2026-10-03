# Tasks: модуль списка чатов 048

Input: [spec](spec.md), [plan](plan.md), [research](research.md), [model](data-model.md), [contract](contracts/chat-list.md). Полный цикл/commit/push `refactor` разрешены.

- [x] T001 Инвентаризовать все `lib/chats`, пять UI-компонентов, badge, потребителей, карту 035 и baseline целевых integration/Query/E2E.
- [x] T002 Провести read-only анализ spec/checklist/research/plan/model/contract/quickstart/tasks, C1–C8 и фактических путей; отдельно сохранить analysis.md.
- [x] T003 Добавить unit tests/unit/chat-list-model.test.ts и RTL tests/component/chat-list.test.tsx для overlay, loading/empty, selected, 99+ и keyboard; подтвердить их на текущем поведении до переноса.
- [x] T004 Разделить `lib/chats` на model/application/server/ui с отдельными types/constants и public entries; перенести компоненты в chats/ui и общий badge в shared/ui; обновить весь граф runtime/test imports и SCSS, две строки карты 035 (`chats-query-options` и физический перенос `session-chat-facts`).
- [x] T005 Green/Refactor: сверить API, query сроки, overlay, retry, selection/unread и client/server graph; при необходимости поведенческого изменения отдельно провести Red → Green → Refactor.
- [x] T006 Выполнить typecheck/lint/styles/format, Vitest/integration/Query/E2E, post-analyze и diff/secret review; оформить verification.md.
- [ ] T007 Предкоммитное review, commit/push `refactor` и обе CI jobs кодового SHA; обновить roadmap/spec/tasks/verification и подтвердить CI документационного SHA.

035 + 043 + 044 → T001 → T002 → T003 → T004 → T005 → T006 → T007. Перенос и разделение типов сохраняют поведение, поэтому искусственный Red не нужен; любая новая бизнес-логика требует поведенческого Red до кода.

| Требование | Задачи |
| --- | --- |
| FR-001 | T001, T003–T006 |
| FR-002 | T001, T003–T006 |
| FR-003 | T001, T003–T006 |
| FR-004 | T001, T004–T006 |
| FR-005 | T001, T003–T006 |
| FR-006 | T001, T003–T006 |
| FR-007 | T002, T004–T006 |
| SC-001 | T004–T007 |
| SC-002 | T003–T007 |
| SC-003 | T003–T007 |

Название кодового коммита: `refactor(chats): isolate list model and UI`.
