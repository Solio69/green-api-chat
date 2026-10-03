# Проверка 037: единый серверный контекст

Дата: 2026-10-03. Локальная реализация и проверки завершены; удалённый CI NotRun до push.

| Проверка | Результат |
| --- | --- |
| Spec Kit и read-only анализ до кода | Passed: 850 путей, SHA-256 до/после `e833b98bdbcd04df597bec1bc98d5e6ff02aaf71b3d1a1dea4b54ff183d2299d`, unchanged |
| Baseline перед 037 | Passed: 036 integration 351/351, Vitest 15/15, query 45/45, production E2E 110/110, обе jobs на финальном SHA 036 |
| Контрактный Red | Passed: `npx vitest run --project node tests/unit/server-session-context.test.ts`; 3/4 поведенческих assertions упали на stub (`unconfigured`, `authorized`, изоляция); import/environment ошибок нет |
| Green после reader | Passed: 4/4 после исправления тестовой фикстуры повреждённой cookie (изменение последнего символа не гарантировало порчу seal) |
| Green после refactor | Passed: 4/4 после устранения self-import |
| Полный Vitest | Passed: 19/19 |
| Полный integration | Passed: 351/351 |
| Полный query browser | Passed: 45/45 |
| Полный production E2E | Passed: 110/110, включает production build |
| Typecheck app/tests/query | Passed |
| ESLint, Stylelint, Prettier | Passed |
| Граф Client Components → auth/server и server/session | Passed: 28 roots, 218 source TS/TSX; запрещённых путей 0 |
| Старые session/notification пути | Passed: импортов `@/lib/auth/session`, `readNotificationContext`, `request-context` в src/tests 0 |
| GitHub Actions quality/browser | NotRun |
| Предкоммитный review | Passed: 28 staged files, `git diff --cached --check` чист; перенос 97%-rename, удалён только duplicate notification reader, новые tests/Spec Kit в объёме 037 |

Сессия по-прежнему в cookie с теми же 24 часами, HttpOnly/SameSite Lax и Secure в production. `readRequestSession` различает три состояния без cookie write и не отдаёт секрет; `readRouteSession` замыкает удаление на cookie store конкретного запроса. `readPageSession` имеет только чтение. `messages/route.ts` больше не зависит от notifications для сессии. HTTP-коды, редиректы и ответы проверены regression suite.

Удалённый CI и head_sha будут добавлены после публикации.
