# Verification 050 — изоляция тестовых фикстур

## Результат и исходная проверка

Технический комплект и [read-only analysis](analysis.md) сохранены до правок кода. Исходная опора: CI 049 `quality` и `browser` успешны на SHA `ae6d97c9d80eff1c717cc76c9c0d8e0f8b39e12f`. Целевой Red подтверждён существующим account E2E с `--repeat-each=2`: первый сценарий прошёл, второй получил HTTP 503 вместо ожидаемого 200 из-за process-global `stateCalls`. Это поведенческое падение, не ошибка сборки.

## Реализация

- Общие тестовые значения разделены на семь доменов; `tests/constants.ts` остался compatibility barrel, `tests/protocol.constants.ts` сохраняет независимые ожидаемые literals.
- E2E automatic fixture сбрасывает fake GREEN-API перед и после каждого сценария через отдельный Playwright API-контекст с явным `dispose()`. Тестовый sentinel распознаётся только fake preload; продуктовый route не менялся. Все E2E specs используют fixture. Отложенные status callbacks сверяют generation.
- Query automatic fixture очищает test app до/после сценария. Reset создаёт новые state и context, поздний send не записывает данные следующего сценария; `receive` не читает новую очередь старым запросом. Fake-ответы не импортируют production constants для HTTP/status oracle.
- В UI-проверке поиска произвольные 300 мс заменены управляемым Promise; pending наблюдается до release, который выполняется в `finally`. Браузерные cookie, Web Locks, focus и geometry остались реальными.
- Постоянные `query-fixture-isolation.test.ts` и `fixture-isolation.spec.ts` проверяют новый жизненный цикл. Неверный oracle `deliberately-wrong-outcome` временно дал одно ожидаемое assertion failure (`outcome_unknown` против неверного значения), после чего файл восстановлен; повторный Vitest зелёный.

## Проверки

| Команда / контроль | Результат |
| --- | --- |
| `npm run typecheck` | Passed: app, tests, query |
| `npm run lint` | Passed |
| `npm run lint:styles` | Passed |
| `npm run format:check` | Passed |
| `npm run test` | Passed: 27 файлов, 95 тестов |
| `npm run test:integration` | Passed: 366/366 |
| `npm run test:query` | Passed: 46/46; выбранный composer отдельно 8/8 |
| `npm run test:e2e` | Passed: 112/112 после окончательной fixture; production build внутри runner успешна |
| Новый E2E `--repeat-each=2` | Passed: 4/4; прежнее загрязнение не повторилось |
| `git diff --cached --check` и предкоммитное ревью | Passed; 33 собственных файла, нет новых пакетов, маршрутов, реальных реквизитов или правок `src` |

Перед окончательным `dispose()` в локальном Windows-прогоне Playwright показывал диагностическое `UV_HANDLE_CLOSING` при успешных тестах. После перехода на отдельный API-контекст повторный и полный E2E прошли без этой диагностики. Различие окружений и версии зафиксированы в `package.json`; новых зависимостей нет.

## GitHub CI

Кодовый коммит `4e4c88eeb3b1fa3cb5ff68bb12c84e36e1d7454d` запушен в `origin/refactor`. [Run 37156062735](https://github.com/Solio69/green-api-chat/actions/runs/37156062735) завершился `success`: `quality=success`, `browser=success`; сохранены артефакты `quality-1` и `browser-1`. Документационный коммит проверяется собственным последующим CI run. Задача 051 продолжает перенос Node-проверок; 050 не меняет их контракт или продукт.
