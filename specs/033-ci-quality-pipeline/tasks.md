# Tasks: CI качества 033

Input: [spec.md](spec.md), [plan.md](plan.md).
Авторизован полный цикл с commit/push в refactor.

- [x] T001 [US1] Проверить GitHub/default branch/actions/Node, подготовить research, plan, data-model, contracts/quality-ci и quickstart в specs/033-ci-quality-pipeline.
- [x] T002 [US1] Провести read-only анализ комплекта и C1–C8; отдельно сохранить analysis.md.
- [x] T003 [US1] Создать .github/workflows/quality.yml и описать CI в README.md; проверить YAML и локальные команды quickstart.
- [ ] T004 [US1] Провести предкоммитное ревью, записать локальные результаты verification.md, commit/push; проверить настоящий чистый успешный Actions run и artifact.
- [ ] T005 [US1] Проверить локально TS2322, временно добавить runner-only контроль в workflow; review/commit/push и проверить ожидаемый failed run с диагностикой.
- [ ] T006 [US1] Удалить контроль из workflow, review/commit/push; подтвердить восстановленный успешный Actions run.
- [ ] T007 [US1] Обновить verification/spec/checklist/tasks/analysis и docs/refactoring-roadmap.md, провести финальное ревью, commit/push и проверить итоговый head.

## Зависимости и приёмка

032 → T001 → T002 → T003 → T004 → T005 → T006 → T007.
Конфигурация проверяется valid/invalid/restore; новая бизнес-логика отсутствует.
Локальный success не подтверждает удалённый. Артефакт ошибок обязателен.
Manual dispatch до появления workflow в main и настоящий fork PR остаются NotRun.

| Требование | Задачи |
| --- | --- |
| FR-001 | T001, T003, T004 |
| FR-002 | T001, T003, T004 |
| FR-003 | T003, T004, T005, T006 |
| FR-004 | T003, T004 |
| FR-005 | T003, T004, T005 |
| FR-006 | T003, T004 |
| FR-007 | T004, T005, T006, T007 |
| SC-001 | T004, T006 |
| SC-002 | T005 |
| SC-003 | T007 |

T001/T002 — обязательный комплект и анализ, T007 — отчёт и ревью.
Платные услуги и изменения main/branch protection не входят в объём.
