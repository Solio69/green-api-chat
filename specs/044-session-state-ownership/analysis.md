# Анализ 044 до реализации

Дата: 2026-10-03. Проверены spec/checklist/research/plan/data-model/contracts/session-ownership/quickstart/tasks, C1–C8, проектные правила и исходные Query/chat/message/unread/provider файлы. Read-only проход: 21 путь, SHA-256 до/после `70b2f77bf441162c0a7bf14cb8039ac7b28cbec66b12dcdc4f764a421ec9f92a`, unchanged=true. Отчёт записан отдельным действием после прохода.

## Findings

Открытых CRITICAL/HIGH/MEDIUM/LOW: 0. Generic core остаётся владельцем жизненного цикла и transport injection, chat query policy и memory defaults получают явных владельцев. Текущие ключи/сроки указаны в data-model, а удаление `session.options()` трассируется до runtime и тестовых потребителей. Временная React selection принадлежит экземпляру QueryProvider, не дублируется в QueryClient. Новое хранилище не требуется.

## Трассировка

| Требование | Задачи | Доказательство |
| --- | --- | --- |
| FR-001 | T001, T003–T006 | core без feature imports |
| FR-002 | T001, T003–T006 | таблица ключей и владельцев |
| FR-003 | T001, T003–T006 | stale/GC и retention |
| FR-004 | T001, T003–T006 | close/callback errors/late response |
| FR-005 | T001, T005–T006 | seen/unread replay |
| FR-006 | T001, T005–T006 | исходящие/ignored/status/visibility |
| FR-007 | T003–T006 | read hooks без второго store |
| FR-008 | T001, T005–T006 | accessId/selectionEpoch |
| SC-001 | T003–T007 | import boundary |
| SC-002 | T001, T003–T007 | scope/close/GC tests |
| SC-003 | T001, T005–T007 | unread/selection/RTL/Query/E2E |

C1–C8 PASS: варианты и риск рассмотрены; 044 отдельна от UI и фикстур; авторизация реализации и commit/push сохраняется; новых пакетов, БД и реальных реквизитов нет; baseline 33/33 targeted integration и 8/8 React lifecycle зелёный; чистый перенос не требует искусственного Red; выбран минимум композиционных функций. 8 FR, 3 SC, 7 задач; покрытие 11/11; задач без требования 0, существенных неоднозначностей и дублей 0. Новые архитектурные проверки, реализация, полная регрессия и CI пока NotRun; результаты будут в verification.md.

## Повторный read-only анализ после реализации

Проверены 23 файла документации, исходников и тестов; SHA-256 до/после `cb4eca5f5250e288f388843de165a2cbbe795b56f8334408644da659685a50ff`, unchanged=true. Открытых findings: 0. В generic QuerySession нет feature imports и прежнего `session.options()`; вызывающие модули используют явного владельца chat options. Реальный ключ unread — `chat-unread`, он сверён с константой и тестом. Полная регрессия и review приведены в verification.md.
