# Tasks: границы модулей 035

Input: [spec.md](spec.md), [plan.md](plan.md). Авторизован полный цикл
review/commit/push в refactor.

- [x] T001 Сверить 028–034, все tracked src/tests, AST-граф и действующие правила; подготовить research, plan, data-model, contracts и quickstart.
- [x] T002 Выполнить read-only анализ полного комплекта, C1–C8, FR-001–FR-007 и SC-001–SC-003; findings устранить до результата.
- [x] T003 Создать ownership-map.csv для каждого tracked src/tests с владельцем, target area и migration task/retain; проверить уникальность и точное равенство инвентарю.
- [x] T004 Написать docs/architecture.md: целевое дерево, DAG, public entries, границы server/client, план 036–049 и текущие нарушения.
- [x] T005 Согласовать CODING_RULES с feature-local расположением и import rules без изменения иных правил стиля; обновить roadmap.
- [x] T006 Проверить CSV/граф/ссылки, format и diff; подготовить verification, предкоммитное ревью, commit/push и фактический CI на head_sha.

Зависимость: 034 завершена → T001 → T002 → T003 → T004 → T005 → T006.

| Требование | Задачи |
| --- | --- |
| FR-001 | T001, T003, T004 |
| FR-002 | T001, T004 |
| FR-003 | T003, T006 |
| FR-004 | T001, T004, T006 |
| FR-005 | T001, T004, T005 |
| FR-006 | T004, T005 |
| FR-007 | T003–T006 |
| SC-001 | T003, T006 |
| SC-002 | T004, T006 |
| SC-003 | T004–T006 |
