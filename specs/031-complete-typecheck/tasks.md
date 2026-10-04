# Tasks: Общий typecheck

Input: [spec.md](spec.md), [plan.md](plan.md).
Авторизация полного цикла и commit/push получена; конфигурация и проверки завершены.

- [x] T001 [US1] Исследовать области, варианты и CLI; подготовить research.md, plan.md, data-model.md, contracts/typecheck.md, quickstart.md в specs/031-complete-typecheck.
- [x] T002 [US1] Провести read-only анализ spec/plan/tasks/C1–C8 и записать specs/031-complete-typecheck/analysis.md после прохода.
- [x] T003 [US1] Обновить package.json, tsconfig.json, tsconfig.vitest.json, tests/fixtures/query-app/tsconfig.json; сохранить strict и явные области. README.md описывает одну полную команду.
- [x] T004 [US1] Выполнить временные TS2322 probes и проверку matcher-изоляции, контроль полноты областей, clean typegen и итоговые команды quickstart. Сохранить факты в specs/031-complete-typecheck/verification.md.
- [x] T005 [US1] Выполнить предкоммитный рефакторинг/ревью, актуализировать spec.md, checklists/requirements.md, tasks.md, analysis.md этой задачи и docs/refactoring-roadmap.md; проверить итоговое соответствие.

## Зависимости

030 → T001 → T002 → T003 → T004 → T005.
Конфигурация проверяется положительными и нарушающими примерами.
Новой бизнес-логики нет, искусственного TDD Red нет. Найденные несвязанные
дефекты фиксируются отдельно; утверждённое поведение не меняется.

## Покрытие

| Требование | Задачи |
| --- | --- |
| FR-001 | T001, T003, T004 |
| FR-002 | T003, T004 |
| FR-003 | T003, T004 |
| FR-004 | T003, T004 |
| FR-005 | T004 |
| FR-006 | T003, T004, T005 |
| SC-001 | T004 |
| SC-002 | T004 |
| SC-003 | T003, T004, T005 |

Все задачи имеют основание: T001/T002 обеспечивают процесс, T005 ревью и документацию.
Установок/БД нет. После проверок точные файлы коммитятся и отправляются в refactor
по прямому поручению пользователя. Git SHA подтверждает commit/push.
Название: chore: check types across all application and test projects.
Следующая задача 032 — ESLint с типами.
