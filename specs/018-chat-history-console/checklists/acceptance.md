# Acceptance Checklist: история в консоль

**Kind**: Acceptance
**Feature**: [spec.md](../spec.md)
**Статус**: Автоматическая приёмка Passed; ручное ревью пользователя/реальный инстанс NotRunExternal. Предкоммитное ревью основного агента выполнено после заморозки документов.

| Проверка                                                     | FR/SC                                | Статус |
| ------------------------------------------------------------ | ------------------------------------ | ------ |
| Cookie/scope/count: 10/server/API ошибки/no-store/abort      | FR-001–FR-003,FR-006 / SC-001,SC-004 | Passed |
| Возврат/A→B→A/текущая консоль/пустой ответ                   | FR-002,FR-004–FR-005 / SC-001–SC-003 | Passed |
| Кеш сохраняет известное, консоль только свежий ответ         | FR-007 / SC-006                      | Passed |
| Logout/scopechange/401/409/cleanup/StrictMode, регрессия 014 | FR-006–FR-008 / SC-004               | Passed |
| Отсутствие редизайна/истории UI/sending/queue/DB             | FR-009 / SC-005                      | Passed |

Основания: [verification.md](../verification.md), полный integration 198 Passed,
Query 18 Passed и production E2E 88 Passed. Неподтверждённый результат ручной
проверки не объявляется Passed; Git коммит не создан. Полный read-only
[analysis.md](../analysis.md) сохраняется отдельно; чек-лист не подменяет его.
