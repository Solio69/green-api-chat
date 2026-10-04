# Tasks: перенос Node-проверок в Vitest 051

- [x] T001 Зафиксировать исходный Green 366/366, открыть B028 coverage map, выполнить read-only discovery; создать поименный `inventory.md` и `scenario-map.json` для 351 B028 + 15 новых ID.
- [x] T002 Провести read-only анализ spec/checklist/plan/research/model/contract/inventory/scenario-map/quickstart/tasks против текущих тестов и C1–C8; отдельно сохранить `analysis.md` и дать ссылку пользователю.
- [x] T003 Создать семь unit и 21 integration копию `.test.ts` с Vitest import, заменить `test.afterEach` в polling; добавить integration project и включить файлы в test typecheck. Старые `.spec.ts` пока сохранить.
- [x] T004 Запустить новый Vitest по областям и старый Playwright 366/366, исправить только совместимость runner (poll/timeout/cleanup) и проверить реальные QueryClient/session/send/ACK взаимодействия. Сверить 366 заголовков и ID; существенные слабые assertions улучшить в пределах существующего контракта.
- [x] T005 После Green удалить 28 старых `.spec.ts` и `playwright.integration.config.ts`; обновить `test:integration` в package.json и убрать дублирующий CI шаг; проверить discovery ровно в одном Vitest project на файл.
- [x] T006 Запустить typecheck/lint/styles/format, Vitest unit/integration/dom и browser Query/E2E; отрицательный контроль oracle, read-only post-analysis, предкоммитное review и `verification.md`.
- [x] T007 Commit/push `refactor`, обе CI jobs и artifacts; обновить roadmap/spec/tasks/verification и проверить документационный CI. Английский коммит: `test: migrate node integration suites to Vitest`.

Зависимости: 039/042/044/050 → T001 → T002 → T003 → T004 → T005 → T006 → T007. FR-001–003: T001/T003/T004/T006; FR-004: T004/T005/T006; FR-005: T004/T006; FR-006–007: T005–T007. SC-001–003: T004–T007. Продуктовое поведение/новые зависимости не меняются; чистый перенос опирается на Green исходного набора, не на искусственный Red.
