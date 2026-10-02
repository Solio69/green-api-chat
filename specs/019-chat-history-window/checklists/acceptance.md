# Acceptance Checklist: история выбранного чата и кеш

**Kind**: Acceptance. **Created**: 2026-10-02.
**Feature**: [spec.md](../spec.md). **Status**: Passed isolated; A09 — NotRunExternal. [Доказательства](../verification.md).

| ID  | Проверка                                                                                      | FR / SC                              | Результат      |
| --- | --------------------------------------------------------------------------------------------- | ------------------------------------ | -------------- |
| A01 | Existing/found confirmed chat свежие десять сообщений через 018, no client token              | FR-001–FR-002,FR-006,FR-011 / SC-001 | Passed         |
| A02 | loading/empty/nonempty/error с/без известного различимы                                       | FR-003 / SC-002–SC-003               | Passed         |
| A03 | Direction/time/HTML literal/wrap по UI-012/UI-014/UI-016                                      | FR-004,FR-012 / SC-002               | Passed         |
| A04 | A→B→A, close/мобильный возврат/logout/changed cookie не подменяют history                     | FR-005,FR-011 / SC-004               | Passed         |
| A05 | Merge id, same text/different id, empty/error retain и >10 data                               | FR-002–FR-003,FR-006–FR-007 / SC-003 | Passed         |
| A06 | Unsupported placeholder без attachment request                                                | FR-009 / SC-002                      | Passed         |
| A07 | Pure merge live/history/accepted, early TTL/max, monotonic status и issue publication fixture | FR-007–FR-010 / SC-005 foundation    | Passed         |
| A08 | Overlay label отдельно, accepted/incoming, empty/error, provider reconcile;014 policy прежняя | FR-007,FR-011–FR-012 / SC-003,SC-006 | Passed         |
| A09 | Реальный history/live/accepted/status совместный сценарий после 023/021/024                   | FR-007–FR-008,FR-010 / SC-005        | NotRunExternal |
| A10 | No pagination/storage/SSE/send/redesign diff; scroll не вызывает сеть                         | FR-006,FR-010–FR-012 / SC-006        | Passed         |
| A11 | Typecheck/lint/styles/targeted tests/format и read-only review                                | Все FR/SC, C7                        | Passed         |

Отметки меняются только по фактической проверке после разрешения реализации.
Readiness требований — другой чек-лист. NotRunExternal не равно Passed и
не блокирует изолированный foundation 019; весь SC-005 завершится лишь после
реальной внешней интеграции. Изолированный код и тесты написаны и проверены; реальные provider-сценарии вручную пока NotRun.
