# Quickstart 038

1. Установить `SPECIFY_FEATURE_DIRECTORY` в абсолютный каталог `D:\Pet-projects\green-api-chat\specs\038-shared-http-guards`; выполнить `check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks -ExpectedFeatureDirectory` с тем же путём и сверить FEATURE_DIR.
2. Прочитать `research.md`: матрица маршрутов является baseline. Запустить существующий integration suite и новый matrix test на старом коде, сохранить Passed.
3. После read-only `analysis.md` написать `tests/unit/http-guards.test.ts`, запустить `npx vitest run --project node tests/unit/http-guards.test.ts` и подтвердить поведенческий Red. Ошибка импорта/окружения не Red.
4. Реализовать shared helpers и перенести handlers без смены порядка/HTTP mapping. Повторить Green нового unit и baseline matrix.
5. Выполнить `npm run typecheck`, `npm run lint`, `npm run lint:styles`, `npm run format:check`, `npm test`, `npm run test:integration`, `npm run test:query`, `npm run test:e2e` (production build). Проверить server/client graph и `git diff --check`.
6. Обновить verification и roadmap, review, commit/push `refactor`; подтвердить обе jobs GitHub Actions на SHA кода и итогового документационного коммита.

Реальных credentials и нового пакета не требуется.
