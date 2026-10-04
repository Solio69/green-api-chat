# Tasks: React lifecycle

**Input**: [spec.md](spec.md), [plan.md](plan.md).
**Авторизация**: полный последовательный цикл, commit/push поручены пользователем.
Реализация и проверки завершены. Пути относительно корня.

## Phase 1 — Подготовка
- [x] T001 [US1] Исследовать настоящие провайдеры и исходные проверки; заполнить research.md, plan.md, data-model.md, contracts/lifecycle.md, quickstart.md в specs/030-react-lifecycle-contracts.
- [x] T002 [US1] Проверить spec/plan/tasks read-only; сохранить полный specs/030-react-lifecycle-contracts/analysis.md отдельным действием.

## Phase 2 — Регрессионные проверки
- [x] T003 [US1] Добавить tests/support/provider-lifecycle.ts (управляемый fetch) и tests/component/provider-lifecycle.test.tsx (React harness и все контракты). Подтвердить replay, rerender, новый scope, unmount, поздние ответы/lease, ошибку setup/cleanup, общую сессию потребителей.
- [x] T004 [US1] Уточнить production-название в tests/query/chat-query.spec.ts; проверить чувствительность нового теста временным снятием StrictMode, затем восстановить.

## Phase 3 — Проверка и завершение
- [x] T005 [US1] Выполнить команды quickstart, предкоммитный рефакторинг и ревью всего diff; записать факты/ограничения в specs/030-react-lifecycle-contracts/verification.md. Найденный продуктовый дефект отдельно описать, не ослабляя тест.
- [x] T006 [US1] Обновить specs/030-react-lifecycle-contracts/spec.md, checklists/requirements.md, tasks.md, analysis.md и docs/refactoring-roadmap.md; проверить согласованность финального комплекта. Commit и push подтверждаются отдельно состоянием Git.

## Dependencies & Execution Order

029 → T001 → T002 → T003 → T004 → T005 → T006.
Это регрессия уже существующей реализации, не новая бизнес-логика; искусственного
Red нет. Если понадобится продуктовый фикс, сначала отдельный контракт/тест с
поведенческим Red, затем исправление и Green.

## Coverage

| Требование/критерий | Задачи |
| --- | --- |
| FR-001 | T001, T003 |
| FR-002 | T003, T004 |
| FR-003 | T003 |
| FR-004 | T003 |
| FR-005 | T003 |
| FR-006 | T004 |
| FR-007 | T002, T005 |
| SC-001 | T003, T004 |
| SC-002 | T003, T005 |
| SC-003 | T004, T005, T006 |

## Completion

Результаты тестов и ревью — verification.md, общий прогресс — roadmap.
Коммит: chore: verify real React provider lifecycle.
Следующая согласованная задача 031: полный typecheck.
T006 Git-завершение подтверждается фактическими commit и remote SHA.

## Operator-only actions

Новых установок и действий с БД нет. Commit/push разрешены непосредственно
пользователем для этого чата; общее правило других чатов не меняется.
