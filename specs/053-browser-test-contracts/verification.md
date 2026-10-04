# Verification 053 — browser contracts

## Результат

Сохранены все 149 браузерных сценариев: 112 production E2E и 37 Query browser. [Карта](browser-map.json) содержит уникальные ID, исходные пути, названия и границы. После правок discovery дал `expected=149`, `actual=149`, `e2e=112`, `query=37`, `missing=[]`, `extra=[]`; все 109 B028 E2E сохранены, три поздних сценария получили N053 ID. Девять ранее перенесённых RTL проверок остаются в 052 и не возвращены в Playwright.

В четырёх E2E файлах убраны проверки сериализации SVG и generic DOM selector там, где контракт выражается доступной ролью, именем и действием. Геометрия, touch target, fallback icon, тема, scroll, focus и проверка отсутствия секретов в HTML сохранены. Приложение, зависимости, CI конфигурация и fake provider не менялись.

## Локальная проверка

| Проверка | Результат |
| --- | --- |
| `npm run typecheck` | Passed: app, Vitest, Query fixture |
| `npm run lint`, `npm run lint:styles` | Passed |
| `npm run format:check` | Passed после форматирования четырёх файлов |
| `npm test` | Passed: 59 файлов, 470 тестов |
| `npm run test:query` | Passed: 37/37, настоящий Chromium |
| `npm run test:e2e` | Passed: 112/112, production Next build + fake GREEN-API |
| Поимённый discovery | 149/149, missing=0, extra=0 |
| `git diff --cached --check` и staged review | Passed: только 15 файлов 053, два замечания trailing whitespace устранены до commit |
| Read-only post-analysis | Passed: 1068 project files, snapshot до/после совпал, 7 FR + 3 SC + 6 T-ID, findings 0 |

Оба Playwright config имеют `retries: 0`, `trace: retain-on-failure`, разные output/report каталоги. `waitForTimeout` в остающихся сценариях не найден. Сценарии с `innerHTML` проверяют отсутствие секретов в rendered HTML; это намеренный security oracle. Негативный контроль публикации отчёта при падении ранее выполнен в 034, GitHub run `37121813552`; 053 проверил текущий положительный run, не вводя временный падающий тест в основную ветку.

## GitHub CI

Кодовый коммит [`4f14bfbff29038a8203b1ce5f83f6015f61ac912`](https://github.com/Solio69/green-api-chat/commit/4f14bfbff29038a8203b1ce5f83f6015f61ac912) запушен в `origin/refactor`. [Run 37162282747](https://github.com/Solio69/green-api-chat/actions/runs/37162282747) завершился `success`: `quality=success`, `browser=success`; опубликованы `quality-1` (artifact 11287837922) и `browser-1` (artifact 11288127341). Документационный коммит [`fa3b7b4dde9233fafd1a200178ad1e128db8a1b1`](https://github.com/Solio69/green-api-chat/commit/fa3b7b4dde9233fafd1a200178ad1e128db8a1b1) прошёл [run 37162673987](https://github.com/Solio69/green-api-chat/actions/runs/37162673987): обе jobs успешны, оба artifact опубликованы.
