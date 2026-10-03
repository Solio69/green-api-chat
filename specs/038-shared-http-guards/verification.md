# Проверка 038: общие HTTP-проверки

Дата: 2026-10-03. Реализация и локальная регрессия завершены; commit/push и удалённый CI фиксируются после публикации.

| Проверка | Результат |
| --- | --- |
| Spec Kit и анализ до реализации | Passed: 863 пути, SHA-256 до/после `9273f2c6d404582fb456814b78646878ba37908c2da5abad3e9588b303287f19`, unchanged; findings 0 |
| Integration matrix на старых handlers | Passed: 8/8, baseline Passed (это не Red) |
| Новый shared API Red | Passed: 6/7 поведенческих assertions упали на минимальном stub, import/environment ошибок нет |
| Новый shared API Green | Passed: 7/7 |
| Integration после миграции | Passed: 359/359, включая 8 matrix-тестов |
| Vitest | Passed: 26/26, 7 файлов |
| Browser Query | Passed: 45/45 |
| Production E2E | Passed: 110/110, включая production build |
| Typecheck app/tests/query | Passed |
| ESLint, Stylelint, Prettier | Passed |
| Граф Client Components → server auth/session/http | Passed: 28 roots, 225 source TS/TSX; запрещённых путей 0 |
| Повторный read-only анализ | Passed: 873 пути, SHA-256 до/после `e426d6aba47ae5613ebc5255aa6e6ad34d8f5e67dd4e6604f85614207d671e4c`, unchanged; findings 0 |
| `git diff --check` | Passed |
| GitHub Actions quality/browser | NotRun до commit/push |

Строгие Origin/Host и scope имеют общую реализацию, но маршруты по-прежнему сами задают порядок проверок и ответы. Send сохраняет фактический лимит 65 536 байт и 413; notifications — 8 192 и 400, в том числе прежний precheck Content-Length; history/recipient не получили нового лимита. JSON no-store helper не скрывает тело и статус. Реальные реквизиты в тестах не используются.
