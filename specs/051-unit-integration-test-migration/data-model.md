# Data Model: scenario migration 051

`ScenarioRecord` в [scenario-map.json](scenario-map.json): `id` (B028-I-xxxx либо N051-I-xxxx), `title`, `source`, `destination`. ID и заголовок неизменны при переносе; целевой путь определяется типом unit/integration из исходного реестра. Для 15 новых после B028 ID назначены один раз. Проверка сравнивает множество `(id,title,destination)` и фактически обнаруженные тесты, а не только totals.

`RunnerProject`: `unit` (Node, чистые правила), `integration` (Node, настоящие модули), `dom` (jsdom, RTL). Каждый файл исполняется только в одном Vitest project; E2E/Query браузерные файлы остаются в Playwright. Node setup восстанавливает таймеры и глобальные подмены после теста; QueryClient/session создаются на сценарий и закрываются в `finally`/afterEach.

Текущая карта: 28 исходных файлов и 366 сценариев, из них 351 B028 и 15 N051; 7 файлов назначены unit, 21 — integration. Перенос не меняет ожидаемые продуктовые данные и не создаёт миграций БД.
