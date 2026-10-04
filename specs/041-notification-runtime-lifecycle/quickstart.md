# Quickstart 041

1. Явно задать `SPECIFY_FEATURE_DIRECTORY` = `D:\Pet-projects\green-api-chat\specs\041-notification-runtime-lifecycle`; сверить FEATURE_DIR с ожидаемым абсолютным путём через `check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks -ExpectedFeatureDirectory`.
2. Прочитать `research.md`, контракт и матрицу исходных polling/RTL тестов. Выполнить read-only analyze, записать `analysis.md` отдельно.
3. Для новой точки инъекции написать тест и подтвердить поведенческий Red на минимальном stub; затем Green, интеграция контроллера и Refactor. Чистое перемещение исходного цикла опирается на baseline 15/15 polling, 8/8 lifecycle.
4. Проверить те же ACK proof, Retry-After/backoff/spacing, late lock/close и одну recovery команду. Использовать fake scope/proof, без реальной очереди.
5. Последовательно выполнить `npm run typecheck`, `npm run lint`, `npm run lint:styles`, `npm run format:check`, `npm test`, `npm run test:integration`, `npm run test:query`, `npm run test:e2e`. Playwright runner не запускать одновременно из-за пересекающихся outputDir.
6. Повторный read-only analyze, `git diff --check`, review точного diff, commit/push `refactor`, обе CI jobs на SHA кода, обновление roadmap/spec/verification и проверка итогового SHA.

Новых зависимостей, серверных API и пользовательских действий нет.
