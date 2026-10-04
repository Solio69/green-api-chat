# Quickstart проверки 037

1. Задать `SPECIFY_FEATURE_DIRECTORY` абсолютным `D:\Pet-projects\green-api-chat\specs\037-server-session-context`; проверить `check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks -ExpectedFeatureDirectory <тот же путь>`.
2. Прочитать `analysis.md`: read-only SHA до/после и findings должны быть закрыты до кода.
3. Запустить исходные `npm run test:integration` и при необходимости целевые E2E. Добавить `tests/unit/server-session-context.test.ts` и подтвердить поведенческий Red командой `npx vitest run --project node tests/unit/server-session-context.test.ts`; ошибка импорта/окружения не считается Red.
4. Реализовать reader и adapters, затем `npx vitest run --project node tests/unit/server-session-context.test.ts` для Green. Повторить после refactor.
5. Выполнить `npm run typecheck`, `npm run lint`, `npm run lint:styles`, `npm run format:check`, `npm test`, `npm run test:integration`, `npm run test:query`, `npm run test:e2e` (E2E содержит production build); проверить import graph, diff и секреты.
6. Обновить `verification.md` фактическими результатами, commit/push `refactor`, проверить обе GitHub Actions jobs по фактическому head SHA. Обновить дорожную карту и проверить CI документационного коммита.

Нужны только существующие Node/npm и установленные зависимости проекта; реальный аккаунт GREEN-API не нужен, тесты используют фиктивные данные.
