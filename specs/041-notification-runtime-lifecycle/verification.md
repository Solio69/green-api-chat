# Проверка 041: сетевой цикл и жизненный цикл уведомлений

Дата: 2026-10-03. Локальная реализация и регрессия завершены; GitHub CI Passed на SHA кода `5bc96a2a9d04a92bf76607d7ce4b165043215eb3`.

| Проверка | Результат |
| --- | --- |
| Spec Kit и анализ до кода | Passed: 901 путь, SHA-256 до/после `b2385810f3566fd522655b6a746831a2ca39856e00ae017d5c4af371d420433b`, unchanged; findings 0 |
| Polling и RTL baseline | Passed: 15/15 polling, 8/8 React lifecycle на исходном цикле |
| Новый runtime Red | Passed: 5/5 поведенческих tests упали на импортируемом stub; причина — отсутствующие settings/receive/ACK/wait, не окружение |
| Управляемое HTTP-date время Red | Passed: ожидалось 3000 ms, получено 0 ms при прежнем `Date.now` |
| Runtime и transport Green | Passed: исходные 5/5 runtime и 1/1 time после реализации |
| Дополнительные unit границы | Passed: late ACK при close и coalesced chat-refresh/cleanup; итог 6 runtime, 1 transport-time, 1 refresh |
| Targeted polling / RTL | Passed: 16/16 polling с новым close-during-ACK, 8/8 StrictMode/lifecycle |
| Полный Vitest | Passed: 49/49, 13 файлов |
| Полный integration | Passed: 363/363 |
| Browser Query | Passed: 45/45 при изолированном Playwright-прогоне |
| Production E2E | Passed: 110/110 с production build |
| Typecheck app/tests/query | Passed после финального теста |
| ESLint, Stylelint, Prettier | Passed после форматирования нового теста |
| Граф Client Components → server runtime | Passed: 28 client roots, 228 source TS/TSX, запрещённых runtime-путей 0 |
| Повторный read-only анализ | Passed: 906 путей, SHA-256 до/после `301f7e91c0b6f18f9f497484205f07311d9d44250b17f2cad5c760ccf0c3085e`, unchanged; findings 0 |
| `git diff --check` | Passed |
| GitHub Actions quality/browser | Passed: обе jobs [run 37137039165](https://github.com/Solio69/green-api-chat/actions/runs/37137039165), artifacts `quality-1` и `browser-1` |

Сетевой runtime выполняет один последовательный settings/receive/ACK-цикл и сохраняет proof до подтверждения или expiry. Контроллер владеет Web Lock, поколением, abort, подписками и моделью 040; поздние settings/receive/ACK не применяются после закрытия. HTTP-date Retry-After, jitter/backoff и throttled refresh имеют управляемые зависимости для теста с прежними production defaults. Серверный protocol, UI и данные переписки не менялись. Тесты используют фиктивные scope/proof.

Playwright Query, integration и E2E запускались последовательно из-за пересекающихся каталогов артефактов; исправление этой организации остаётся в задаче 050. Итоговый документационный SHA проверяется отдельно после push.
