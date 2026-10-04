# Tasks: завершение переноса и архитектурное ревью 054

- [x] T001 `inventory.md`, `migration-map.json`: сверить 63 файла 035 + 6 новых, target collisions, два цикла и QueryProvider inversion; baseline 053 локально/CI.
- [x] T002 Полный комплект `plan.md`, `research.md`, `data-model.md`, `contracts/architecture-boundaries.md`, `quickstart.md`; read-only analyze с hash snapshot, отдельно `analysis.md` и ссылка пользователю.
- [x] T003 Перенести 69 exact-map файлов и сопутствующие SCSS, обновить все импорты `src`, `tests`, query fixture; `src/app`/styles/historical docs оставить. Подтвердить typecheck и отсутствие старых source/alias ссылок до удаления transitional paths.
- [x] T004 Разделить feature-specific `src/features/conversation/ui/QueryProvider` и neutral `src/shared/query/ui`, устранить `get-state↔transport` и `chats/server↔get-chats`; вынести credential type/identifier и PendingAttempt на чистые границы. Сверить DAG и отсутствие server runtime в model/client graph.
- [x] T005 `eslint.config.mjs`: file-scoped boundary restrictions; проверить реальным ESLint допустимый и нарушающий импорт (последний обязан получить error), затем весь repo lint Green. Результат записать.
- [x] T006 Полная регрессия: typecheck/lint/styles/format, Vitest 470+, Query 37, production E2E 112; audit 69 путей, циклов, public entries и фактических потребителей, read-only post-analysis, предкоммитное ревью.
- [x] T007 Code commit/push `refactor`, обе CI jobs/artifacts; `verification.md`, обновить `docs/architecture.md`, `docs/CODING_RULES.md` и roadmap, documentation commit/push/CI. Английский кодовый commit: `refactor: finish feature module migration`.

Порядок T001→T002→T003→T004→T005→T006→T007. FR-001, FR-002, FR-003, SC-001: T001/T003/T004/T006. FR-004, FR-005, SC-002: T004/T005/T006. FR-006, FR-007, SC-003: T004/T006/T007. Это структурный перенос с подтверждённым baseline, а не новая бизнес-логика: искусственный Red не требуется. Для lint guard отрицательный и положительный oracle обязателен.
