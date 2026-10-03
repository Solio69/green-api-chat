# Проверка 036: перенос auth-модуля

Дата: 2026-10-03. Локальная проверка кода завершена;
удалённый CI NotRun до публикации commit.

| Проверка | Результат |
| --- | --- |
| Spec Kit и read-only анализ до кода | Passed: директория 036; 838 путей, SHA-256 до/после `7c3656d30270f44268dfc7e07a695308329213a9187292f1d27a55a5598fddd0`, unchanged |
| Auth integration до переноса | Passed: 87/87 |
| Auth integration после переноса | Passed: 87/87 |
| Полный integration после переноса | Passed: 351/351 |
| Vitest после переноса | Passed: 15/15 |
| Query после переноса | Passed: 45/45 |
| Typecheck app/tests/query | Passed |
| ESLint, Stylelint, Prettier | Passed; исправлены только новые import order/duplicates |
| Граф Client Components → auth/server/session | Passed: 28 client roots, 214 source TS/TSX; запрещённых путей 0 |
| Пять старых auth-путей | Passed: импортов 0; `src/lib/auth/session.ts` намеренно остаётся до 037 |
| Полный production E2E | Passed: 110/110 |
| GitHub Actions quality/browser | NotRun |
| Предкоммитный review | Passed: 33 staged files, `git diff --cached --check` чист, изменены только согласованные импорты/перемещения и Spec Kit |

`AUTH_QUERY` и `HOME_RESULT_KIND` находятся в auth/model;
cookie/env-конфигурация — в auth/server. Пять файлов перемещены с
сохранением функций/ответов; Next `route.ts`, UI LoginForm/LogoutButton
и реализация `session.ts` не переносились. Временные type/config связи
`getQueryScope` с `session.ts` и chats отмечены до 037/048.

Удалённый head_sha и результат CI добавляются
после завершения проверок.
