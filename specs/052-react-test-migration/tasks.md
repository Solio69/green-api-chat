# Tasks: перенос React-проверок в Testing Library 052

- [ ] T001 `specs/052-react-test-migration/inventory.md` и `scenario-map.json`: baseline Query 46/46, 45 B028 ID + один новый, девять RTL/37 browser; прочитать существующие component tests и владельцев probes.
- [ ] T002 Полный технический комплект: `plan.md`, `research.md`, `data-model.md`, `contracts/react-test-migration.md`, `quickstart.md`; read-only analyze FR/SC/C1–C8, хеши до/после, записать `analysis.md` отдельным действием и дать пользователю ссылку.
- [ ] T003 `tests/component/history-provider-contract.test.tsx`: четыре сценария реального `QueryProvider`/selection/history; controlled fetch и cleanup; подтвердить Green рядом со старым `tests/query/history-query.spec.ts`.
- [ ] T004 `tests/component/selection-provider-contract.test.tsx`: три сценария двух consumers, Strict Mode, cache, editor epoch с доступным UI и реальным provider; подтвердить Green рядом со старым `tests/query/conversation-selection.spec.ts`.
- [ ] T005 `tests/component/chats-query-contract.test.tsx` и `session-chat-overlay.test.tsx`: loading/empty и overlay после empty/error с настоящим QueryClient/компонентами; подтвердить Green рядом со старым Query.
- [ ] T006 После parity удалить девять перенесённых Playwright сценариев из трёх файлов и `session-chat-overlay.spec.ts`; удалить только неиспользуемый `SessionOverlayProbe` и `?overlay` ветку test app. Сверить 46 ID: 9 RTL + 37 browser, нет лишнего/потерянного.
- [ ] T007 Полная локальная регрессия: types/lint/styles/format, все Vitest, Query и E2E; проверить Strict Mode replay из 030, отсутствие act/unhandled warnings, negative oracle; read-only post-analysis и предкоммитное ревью.
- [ ] T008 `verification.md`, согласованность spec/tasks/roadmap; code commit/push `refactor`, две CI jobs и artifacts; затем документационный commit/push и CI. Английское название кодового коммита: `test: move React query contracts to Testing Library`.

Порядок T001→T002→T003–T005→T006→T007→T008. FR-001–003/SC-001: T001/T003–T007; FR-004/SC-002: T004/T007; FR-005–006/SC-003: T001/T006/T007; FR-007: T001/T006–T008. Это перенос существующего поведения: подтверждённый baseline и parity, а не искусственный Red.
