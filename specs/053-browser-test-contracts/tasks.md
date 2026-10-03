# Tasks: достоверные браузерные и сквозные проверки 053

- [x] T001 Discovery/ID parity: `inventory.md`, `browser-map.json`, `selector-audit.md`; сопоставить 109 B028 E2E, 37 browser из 052 и 3 новых E2E; подтвердить исходный Green 052 и реальное место каждого browser assertion.
- [x] T002 Полный комплект `plan.md`, `research.md`, `data-model.md`, `contracts/browser-test-contracts.md`, `quickstart.md`; read-only analyze с hash snapshot, отдельно `analysis.md` и ссылка пользователю.
- [x] T003 `tests/e2e/login-form.spec.ts`: удалить SVG `innerHTML` equality, сохранить accessible action, type/value, icon semantics и геометрию. `tests/e2e/home.spec.ts`: удалить generic input count. `tests/e2e/recipient-search.spec.ts`: `getByRole('main')`. `tests/e2e/account-profile.spec.ts`: один `textbox` вместо generic input count. Продуктовый код не меняется.
- [x] T004 Сверить 149 ID после discovery и `selector-audit.md`; проверить keyboard/focus/scroll/responsive/theme/safe-text и осмысленность оставшихся CSS исключений, не удалять нужный browser contract.
- [x] T005 Итог: typecheck, lint, styles, format, Vitest, Query 37, E2E 112; CI/config/report check. Read-only post-analysis и предкоммитное ревью без новых зависимостей.
- [ ] T006 Code commit/push `refactor`, проверить GitHub quality/browser success + artifacts. `verification.md` и roadmap, documentation commit/push, проверить оба CI jobs/artifacts. Английский кодовый commit: `test: harden browser interaction contracts`.

Порядок T001→T002→T003→T004→T005→T006. FR-001, FR-002, SC-001: T001/T004/T005. FR-003, FR-004, SC-002: T003/T004/T005. FR-005, FR-006: T001/T004/T005. FR-007/SC-003: T005/T006. Чистый тестовый рефакторинг использует baseline/parity; изменение бизнес-логики или server contract не планируется, искусственного Red нет.
