# Tasks: Vercel notification polling

**Input**: [spec.md](spec.md), [plan.md](plan.md). **Статус**: Completed / PassedSynthetic; реализация разрешена 2026-10-03, без повторного gate.

- [x] T001 [US1] Сохранить tests/integration/vercel-notifications.spec.ts и подтвердить behavioral Red на действующем handler; контракт receive не зависит от registry.
- [x] T002 [US1] После Red implement stateless settings/receive/ACK/proof, deadlines; убрать process-runtime и sender leases; paths вplan.
- [x] T003 [US1/US2] После Red implement browser lease/transport/sequential controller, cancellation/recovery и сохранение отправки/Query.
- [x] T004 [US1/US2] Адаптировать fake providers/tests, добавить independent-instance ACK/tamper/expiry/crossscope/replay/failure/concurrency/browser-tab/reload сценарии; получить Green.
- [x] T005 [US1/US2] Повторно прочитать docs/CODING_RULES.md/CODE_STYLE.md, review/refactor diff и актуальных tests; сохранить зелёное поведение.
- [x] T006 [US1/US2] Актуализировать docs/README с сохранением чужой правки; quality/regression/build; итоговый read-only analysis.md и verification.md.

## Dependencies

T001 Red → T002/T003 → T004 Green → T005 Refactor → T006 final. Перед реализацией полный read-only анализ. Новых пакетов/БД нет; публикация/Git только пользователь.

## Coverage

| Requirement | Tasks |
| --- | --- |
| FR-001 | T001,T002,T004,T006 |
| FR-002 | T002,T003,T004 |
| FR-003 | T001,T002,T004 |
| FR-004 | T002,T003,T004 |
| FR-005 | T003,T004,T005 |
| FR-006 | T003,T004 |
| FR-007 | T002,T003,T004 |
| FR-008 | T003,T004 |
| FR-009 | T002,T006 |
| FR-010 | T001,T004,T005,T006 |
| SC-001 | T001,T002,T004 |
| SC-002 | T003,T004 |
| SC-003 | T003,T004 |
| SC-004 | T004,T005,T006 |
| SC-005 | T005,T006 |

## Completion

Реальные Passed/Failed/NotRun фиксировать verification. Коммит не создавать; название fix: make notification delivery compatible with Vercel. Осталось операторское размещение и smoke, не новый feature.
