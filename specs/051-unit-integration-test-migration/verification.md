# Verification 051 — перенос Node-проверок в Vitest

## Результат

Исходный Playwright integration набор прошёл 366/366 до удаления старых файлов. [Реестр](inventory.md) и [сценарная карта](scenario-map.json) сопоставили 351 существующий ID B028 по точным имени файла и заголовку, ещё 15 поздних сценариев получили новые ID. После переноса discovery Vitest обнаружил все 366 назначенных сценариев: `missing=0`, `extra=0`, `wrong_projects=0`.

Семь чистых/adapter наборов перенесены в `tests/unit`, 21 набор с реальными связями модулей — в `tests/integration`. Сохранены QueryClient, сессии, send-controller, polling/ACK, API handler, ошибки, повторы и cleanup. Старые 28 `.spec.ts` и `playwright.integration.config.ts` удалены только после Green обоих runner. `npm test` запускает Node, integration и DOM проекты; отдельный `test:integration` оставлен для прицельной работы. CI больше не повторяет integration после общего Vitest запуска. Продуктовый код и зависимости не менялись.

## Постанализ

| Требование | Подтверждение |
| --- | --- |
| FR-001–003 | 28 исходных файлов распределены 7/21, 366 ID сверены с обнаружением нового runner; assertions и сценарии сохранены |
| FR-004 | Query/E2E на настоящих Next routes, cookie, Web Locks и браузере сохранены и прошли 46/46 и 112/112 |
| FR-005 | Временно инвертирован важный oracle раннего статуса в `message-cache`: тест ожидаемо упал; файл восстановлен, затем 10/10 целевого набора прошли |
| FR-006 | `afterEach` polling восстановлен на Vitest, асинхронные тесты и реальный deadline прошли без незавершённых ошибок |
| FR-007 | Команды и CI обновлены; обе CI jobs и артефакты проверены по кодовому SHA |

Новый React/компонентный перенос остаётся задачей 052. Прямые вызовы Node/Next handlers в этом наборе не заменяют browser HTTP-контракты: они сохранены в Query/E2E. Отличий поведения приложения не выявлено.

## Локальные проверки

| Команда / контроль | Результат |
| --- | --- |
| `npm run typecheck` | Passed: app, tests, query |
| `npm run lint`, `npm run lint:styles`, `npm run format:check` | Passed |
| `npm test` | Passed: 55 файлов, 461 тест (148 unit, 285 integration, 28 component) |
| `npm run test:integration` | Passed: 21 файл, 285 тестов |
| `npm run test:query` | Passed: 46/46 |
| `npm run test:e2e` | Passed: 112/112, включая production build |
| Отрицательный контроль и восстановление | Ожидаемый failure 1/1, затем 10/10 Green |
| `git diff --cached --check`, staged review | Passed: 42 файла кодового коммита, 28 Git renames тестов, без изменений `src` и lockfile |

## GitHub CI

Кодовый коммит [`6f199257b851c9c6475c6b20e334fcaeab9e9cb9`](https://github.com/Solio69/green-api-chat/commit/6f199257b851c9c6475c6b20e334fcaeab9e9cb9) отправлен в `origin/refactor`. [Run 37158203040](https://github.com/Solio69/green-api-chat/actions/runs/37158203040) завершился `success`: `quality=success`, `browser=success`; сохранены артефакты `quality-1` и `browser-1`. Документационный коммит проверяется следующим CI run.
