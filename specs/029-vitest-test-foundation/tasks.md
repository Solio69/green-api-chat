# Tasks: рабочая тестовая основа

**Input**: [spec.md](spec.md), [plan.md](plan.md).
**Авторизация**: полный цикл с кодом и локальным commit в refactor разрешён; пользователь отдельно разрешил установить восемь devDependencies по quickstart.
**Статус**: T001–T009 выполнены; результат готов к локальной фиксации T010.

## Phase 1 — Исходное покрытие

- [x] T001 [US1] Подтвердить исходные tests/integration/recipient-label.spec.ts и B028-E-0100 по baseline 028; зафиксировать HEAD/branch/status в verification.md.
- [x] T002 [US1] Обновить package.json и package-lock.json штатным npm install восьми версий из research; проверить npm ls. Добавить команды run/project/watch/typecheck.

## Phase 2 — Конфигурация и тесты

- [x] T003 [US1] Создать vitest.config.mts, tsconfig.vitest.json, tests/setup/timers.ts, tests/setup/node.ts, tests/setup/dom.ts: отдельные include/environment и cleanup.
- [x] T004 [US1] Создать tests/support/query-client.ts, tests/unit/environment.test.ts, tests/component/environment.test.tsx. Проверить отсутствие DOM в Node, development React, очистку DOM/mocks/fetch/env/timers и QueryClient с отменой query.
- [x] T005 [US1] Создать tests/unit/recipient-label.test.ts и tests/component/recipient-search-result.test.tsx с независимыми ожиданиями и исходными fixtures. B028-I-0240/0241 переносятся; DOM-проверка дополняет B028-E-0100, browser contract остаётся.
- [x] T006 [US1] Запустить node/dom отдельно, вместе, файл/name filter и watch. Временно нарушить ожидаемую подпись, получить assertion failure/exit 1, восстановить и повторить полный набор; результаты в verification.md.
- [x] T007 [US1] Только после T006 удалить tests/integration/recipient-label.spec.ts, обновить migration-map.md; выполнить integration, discovery query/E2E и целевой E2E recipient-search-ui.

## Phase 3 — Проверки, рефакторинг и ревью

- [x] T008 [US1] Обновить README.md и docs/refactoring-roadmap.md; выполнить typecheck, typecheck:tests, lint, lint:styles, format:check и docs format. Исправить замечания, проверить diff и неизменность src/.
- [x] T009 [US1] Выполнить итоговый read-only analyze, после прохода записать analysis.md и verification.md, актуализировать spec/checklist/tasks.
- **T010 — заключительное действие Git:** включить точные собственные пути, создать локальный commit в refactor и проверить его состав/status. Название: `chore: add Vitest and React Testing Library foundation`. Подтверждение — фактический commit в ответе.

## Dependencies & Execution Order

Предварительный анализ → T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008 → T009 → T010. Старый тест сохраняется до подтверждения эквивалентности. Инфраструктурные последовательные пары проверяют очистку runtime; продуктовые проверки независимы от порядка.

Новая бизнес-логика не создаётся; искусственный Red продукта не нужен. T006 проверяет конфигурацию: причиной падения должно быть неверное ожидание, не ошибка импорта или установки.

## Coverage

| Требование | Задачи                 |
| ---------- | ---------------------- |
| FR-001     | T002                   |
| FR-002     | T003, T004             |
| FR-003     | T002, T006, T008       |
| FR-004     | T003, T004, T006       |
| FR-005     | T001, T005, T006       |
| FR-006     | T001, T007             |
| FR-007     | T006                   |
| SC-001     | T003, T006             |
| SC-002     | T004, T005, T006, T007 |
| SC-003     | T006                   |

T008/T009 обеспечивают C7 и сопровождаемость; T010 выполняет прямое поручение пользователя. Необоснованных задач нет.

## Completion

Все FR/SC подтверждаются фактическими результатами, код проходит предкоммитное ревью. При обязательной заблокированной проверке задачу не закрывать и не подменять отдельным commit спецификаций. Следующий шаг — 030.

## Operator-only actions

Разовое прямое исключение пользователя позволяет агенту выполнить npm install восьми devDependencies для 029. Общие AGENTS/GIT_POLICY не меняются. Локальный commit разрешён этому чату; push нового результата не выполняется в этой задаче.
