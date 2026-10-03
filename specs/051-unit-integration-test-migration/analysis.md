# Read-only analysis: 051

Дата: 2026-10-04. Код не менялся во время анализа. Статус: PASS; отмечены проверки при реализации.

## Покрытие и трассировка

Текущий Playwright discovery нашёл 28 файлов и 366 развернутых сценариев; исходный `npm run test:integration` прошёл 366/366 в 050. Сопоставление с B028 по точным файлу и заголовку дало 351 старый ID, ноль переименованных старых сценариев и 15 позднее добавленных. Новые ID `N051-I-0001`–`0015` перечислены в [scenario-map.json](scenario-map.json). Семь файлов назначены unit, 21 — integration; сумма и каждый целевой путь есть в [inventory.md](inventory.md).

| Требование | Доказательство в проекте | Задачи и проверка |
| --- | --- | --- |
| FR-001 | Все 28 Node-файлов без Playwright `page`/`context`; 7 чистых unit/adapter | T003–T006, Vitest discovery |
| FR-002 | QueryClient, session, message cache, send-controller, polling/ACK в 21 integration файле | T004/T006, реальные импорты и Green |
| FR-003 | 351 точных B028 ID + 15 новых, неизменные title/path map | T001/T004/T006, машинное сравнение |
| FR-004 | `home-flow`, `history-api`, `send-message` вызывают Node Request/NextRequest и handler напрямую; production HTTP/cookie проверяются E2E | T004/T005/T006, не удалять E2E/Query |
| FR-005 | Есть Assertions состояния, порядка и отказов; `expect.poll` асинхронный и awaited | T004/T006, отрицательный контроль |
| FR-006 | Только один Playwright-specific lifecycle `test.afterEach`; Node setup уже восстанавливает таймеры | T003/T004/T006, clean runner exit |
| FR-007 | Quality workflow запускает `npm test` и отдельно Playwright integration | T005/T006, убрать дубль только после Vitest Green |

## Согласованность и риски

- Spec, checklist, plan, research, model, contract, inventory, scenario map, quickstart и tasks покрывают FR-001–007 и SC-001–003. C1–C8 PASS: договорённость и разрешение пользователя действуют; нет новой зависимости или продуктового поведения; Git-исключение узкое.
- `expect.poll` поддерживается установленным Vitest 5 и официальным API; его default timeout меньше прежнего Playwright, поэтому integration project должен явно сохранить разумный лимит и проверить реальные асинхронные сценарии.
- `NextRequest` и прямой route import потенциально зависят от Vite/Next transform. Это риск исполнения, не основание заранее исключать тесты: перенос считается Green только после фактического выполнения и typecheck. При невозможности переносить конкретный контракт сохраняется исходный Playwright файл с объяснением, без потери ID.
- Существующий `tests/unit/account-profile.test.ts` уже содержит две проверки и не перезаписывается: семь исходных B028 тестов получают целевой путь `tests/unit/account-profile-contract.test.ts` в карте.
- До Green прежние `.spec.ts` и `playwright.integration.config.ts` не удаляются. После Green CI не должен выполнять Vitest integration дважды. Временный отрицательный контроль восстанавливает исходный файл.
- Исторический реестр 028 не переписывается; актуальное соответствие хранится в 051. Реальные browser APIs не мокируются в Node.

## Verdict

Критических противоречий и незакрытых пользовательских решений нет. Реализация может начинаться после подтверждения CI 050: копирование тестов, фактический Vitest Green, удаление старого runner, полная регрессия и предкоммитное ревью. Исходная ошибка трансформации/окружения не является поведенческим Red.
