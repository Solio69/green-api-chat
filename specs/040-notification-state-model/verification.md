# Проверка 040: явная модель состояний уведомлений

Дата: 2026-10-03. Локальная реализация и регрессия завершены; GitHub CI Passed на SHA кода `21fe96198cd45886a5bb2e0c4a46c1b85944dc31`.

| Проверка | Результат |
| --- | --- |
| Spec Kit и анализ до кода | Passed: 890 путей, SHA-256 до/после `84fdddeb80fd9e978eb8ef004db3a10d03efb2e14446c64c463925e47f9f1f33`, unchanged; findings 0 |
| Polling baseline | Passed: 14/14 на исходном контроллере |
| Новая модель Red | Passed: 5/5 поведенческих assertions упали на минимальном stub без import/environment ошибок |
| Новая модель Green и дополнительные границы | Passed: 8/8; connected/retrying/limited/paused/closed, ACK, generation, recovery и outgoing disabled |
| Controller regression | Passed: 15/15, включая отключённые outgoing status webhooks |
| React notice | Passed: 2/2; alert/status, тексты и retry |
| Полный Vitest | Passed: 41/41, 10 файлов |
| Полный integration | Passed: 362/362 |
| Browser Query | Passed: 45/45 при изолированном запуске |
| Production E2E | Passed: 110/110 с production build |
| Typecheck app/tests/query | Passed |
| ESLint, Stylelint, Prettier | Passed |
| Граф Client Components → server runtime | Passed: 28 client roots, 227 source TS/TSX, запрещённых runtime-путей 0 |
| Повторный read-only анализ | Passed: 894 пути, SHA-256 до/после `e99ea7731affeac44a488644f4f8ccf4d42e99eabc6367cbe06caa4e7cc8ad33`, unchanged; findings 0 |
| `git diff --check` | Passed |
| GitHub Actions quality/browser | Passed: обе jobs [run 37134784122](https://github.com/Solio69/green-api-chat/actions/runs/37134784122), artifacts `quality-1` и `browser-1` |

Чистая модель вычисляет состояние и единственную команду recovery; контроллер исполняет сеть, lease, таймеры и публикацию подписчикам. Публичный snapshot не меняет форму и ссылку на внутренних переходах ACK. При временной ошибке ACK proof сохраняется, ручной retry сбрасывает его и инвалидирует предыдущее поколение. Закрытие терминально; поздние события игнорируются. Отключённые outgoing status webhooks показывают предупреждение и сохраняют возможность отправки.

Первый Query-прогон дал 44 успешных сценария и ошибку записи trace на визуальном сценарии 320 px при одновременном integration-прогоне. Конфигурация integration использует родительский `test-results`, а Query — `test-results/query`; отдельный повтор прошёл 45/45. Это ограничение организации тестовых артефактов учтено для задачи 050; поведенческого падения UI не было.

Итоговый документационный SHA `efb2d57f94ec3263d9dd99cf9189f84d902209c1` прошёл обе jobs [run 37135448579](https://github.com/Solio69/green-api-chat/actions/runs/37135448579).
