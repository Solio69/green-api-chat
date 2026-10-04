# Quickstart 042

1. Задать `SPECIFY_FEATURE_DIRECTORY` = `D:\Pet-projects\green-api-chat\specs\042-message-domain-model`; подтвердить FEATURE_DIR через `check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks -ExpectedFeatureDirectory`.
2. Прочитать research/contract и baseline 26 targeted integration. Провести read-only analyze, записать analysis.md отдельным действием.
3. Добавить `tests/unit/message-domain.test.ts` с коллизией одинакового idMessage разных чатов; на текущем публичном merge подтвердить поведенческий Red, затем Green составного identity. Дополнить unit-матрицу источников, статусов, TTL/limit, immutability без повторения внутренних инструкций.
4. Ввести source-tagged факт и MessageView, оставить совместимый adapter. Убрать `!`/непроверенные casts, сохранить внешние валидаторы и кеш-контракт.
5. Проверить targeted 26 integration, затем полные `npm run typecheck`, `npm run lint`, `npm run lint:styles`, `npm run format:check`, `npm test`, `npm run test:integration`, `npm run test:query`, `npm run test:e2e`. Playwright запускать последовательно.
6. Повторный read-only analyze, `git diff --check`, review, commit/push `refactor`, обе CI jobs на кодовом SHA; обновить roadmap/spec/verification и проверить итоговый SHA.

Новых пакетов, реальных реквизитов и серверных API нет.
