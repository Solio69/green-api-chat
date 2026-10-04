# Tasks: Незаметное восстановление уведомлений

**Input**: [spec.md](spec.md), [plan.md](plan.md)  
**Статус**: реализация выполнена локально; проверки и отчёт завершены, без commit/push.

## Phase 1 — Подготовка

- [x] T001 Проверить полный комплект specs/057-silent-notification-recovery, выполнить read-only анализ с сравнением списка и SHA-256 файлов; отдельным действием сохранить analysis.md. Проверить границы 056 и 057.

## Phase 2 — Red → Green

- [x] T002 [US1, US2] После сообщения пользователя о возобновлении сверить git status/diff и актуальные исходники с планом; сохранить работу соседнего чата. Изменить tests/unit/notification-connection-model.test.ts, tests/component/notification-notice.test.tsx, tests/integration/polling-connection.test.ts: canSend при восстановлении после первого подключения, запрет до него, отсутствие плашки при повторных переходах, сохранение других предупреждений. Запустить целевой Vitest из quickstart и подтвердить поведенческий Red.
- [x] T003 [US1, US2] После Red изменить src/features/conversation/notifications/model/connection-model.ts, src/features/conversation/ui/NotificationNotice/NotificationNotice.tsx и constants.ts. Выполнить ту же команду; получить Green без изменения транспорта/отправки/ACK.

## Phase 3 — Браузер и завершение

- [x] T004 [US1, US2] Добавить tests/e2e/notification-recovery.spec.ts с управляемыми receive/POST: повторные сбои и восстановления, нет плашки и сдвига, одна отправка с индикатором на 360/1280. Сценарии входят в итоговый production E2E.
- [x] T005 Выполнить Refactor и review затронутого кода и тестов, убрать повторяемые магические строки в тестовые константы, обеспечить отдельный тестовый TypeScript-проект для редактора, обновить README.md, сохранив 056; провести финальный набор plan/quickstart, повторный read-only анализ; отдельно записать analysis.md и verification.md, актуализировать отметки. Предложить fix: keep notification recovery silent and sending independent.

## Dependencies & Execution Order

T001 → сообщение пользователя о возобновлении → сверка актуального дерева → T002 (запущенный Red) → T003 (Green) → T004 → T005. Работа выполнена последовательно. Ошибка среды не засчитана Red. Существующие lifecycle/ACK/unknown-outcome проверки сохранены и вошли в полный Vitest.

## Coverage

| Требование или критерий | Задачи |
| --- | --- |
| FR-001 | T002, T003, T004 |
| FR-002 | T002, T003, T004 |
| FR-003 | T002, T003, T005 |
| FR-004 | T004, T005 |
| FR-005 | T002, T005 |
| FR-006 | T002, T003, T005 |
| FR-007 | T004 |
| SC-001 | T002, T003, T005 |
| SC-002 | T004, T005 |
| SC-003 | T001, T005 |

## Completion

В verification.md записать команды и результаты Red/Green/финала, область diff и ограничения. Не объявлять сетевую причину production устранённой. T001/T005 обслуживают проверяемость и SC-003; задач без основания нет.

## Operator-only actions

Установки и миграции не нужны. Commit/push и публикацию выполняет пользователь отдельно.
