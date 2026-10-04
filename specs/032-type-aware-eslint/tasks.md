# Tasks: Async lint 032

Input: [spec.md](spec.md), [plan.md](plan.md).
Пользователь поручил полный цикл и commit/push; реализация и проверки завершены.

- [x] T001 [US1] Исследовать 18 диагностик и владельцев ошибок; подготовить research.md, plan.md, data-model.md, contracts/async-lint.md и quickstart.md в specs/032-type-aware-eslint.
- [x] T002 [US1] Проверить spec/plan/tasks и C1–C8 read-only; записать specs/032-type-aware-eslint/analysis.md после прохода.
- [x] T003 [US1] Настроить parserOptions и два правила в eslint.config.mjs; выполнить sync adapters в 12 исходных/test fixture файлах, перечисленных в plan.md; сохранить await/try/catch и контракты поведения.
- [x] T004 [US1] Реальным конфигом проверить invalid/valid/explicit void примеры по каждому правилу, TS-проектам и JS-конфигу. Пройти итоговые команды quickstart и регрессию async сценариев.
- [x] T005 [US1] Провести предкоммитный рефакторинг и ревью всех правок; обновить docs/CODE_STYLE.md, docs/refactoring-roadmap.md и spec/checklist/tasks/analysis/verification этой задачи.

## Зависимости и контроль

031 → T001 → T002 → T003 → T004 → T005.
Это конфигурация и рефакторинг существующих event boundaries.
Существующие сценарии ошибок/повторов используются как регрессия; новый
поведенческий контракт потребовал бы отдельного теста с Red до кода.
Не добавлять пустой catch или void без аудита error owner.
После каждого мелкого изменения тесты не повторяются: один итоговый набор.

| Требование | Задачи |
| --- | --- |
| FR-001 | T001, T003, T004 |
| FR-002 | T003, T004 |
| FR-003 | T004 |
| FR-004 | T001, T003, T004, T005 |
| FR-005 | T003, T004, T005 |
| FR-006 | T005 |
| SC-001 | T004 |
| SC-002 | T004, T005 |
| SC-003 | T005 |

T001/T002 обеспечивают обязательный комплект и анализ; задач без основания нет.
Установок/БД нет. После проверки точные файлы коммитятся и отправляются в refactor.
Коммит: refactor: enforce typed async contracts.
Следующие задачи: 033 и 034, CI качества и браузера.
