# Quickstart 044

1. Указать `SPECIFY_FEATURE_DIRECTORY` = `D:\Pet-projects\green-api-chat\specs\044-session-state-ownership`, подтвердить FEATURE_DIR через `check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks -ExpectedFeatureDirectory`.
2. Сверить research/model/contract, baseline 043 и targeted chat/session/memory/cleanup tests. Провести read-only analyze и записать analysis.md отдельным действием.
3. Вынести generic QuerySession, feature-owned chat options и memory composition; заменить `session.options()` во всех runtime/test потребителях без изменения чисел timing/ключей. Проверить scoped data/cleanup и StrictMode.
4. Выполнить targeted проверки, затем полные typecheck, lint/styles/format, Vitest, integration, Query, production E2E; Playwright по очереди.
5. Повторить read-only analyze, `git diff --check`, review, commit/push `refactor`, проверить обе CI jobs на кодовом SHA; обновить roadmap/spec/verification, проверить итоговый SHA.

Новых пакетов, реальных реквизитов и серверных API нет.
