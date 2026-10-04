# Quickstart 043

1. Задать `SPECIFY_FEATURE_DIRECTORY` = `D:\Pet-projects\green-api-chat\specs\043-conversation-cache-coordinator`; подтвердить FEATURE_DIR через `check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks -ExpectedFeatureDirectory`.
2. Прочитать research/data-model/contract и baseline 29 integration плюс targeted Query. Провести read-only analyze, записать analysis.md отдельным действием.
3. Добавить счётчик cache writes в HistoryProbe fixture и новый Query тест нескольких потребителей; на текущем hook подтвердить Red, причину зафиксировать. Добавить проверку fetch/validation/late access на управляемых Promise.
4. Ввести координатор, вызвать его из единственного queryFn и делегировать accepted/delivery. Получить Green без изменения сетевого/UI контракта и порядка apply-before-ACK.
5. Проверить targeted integration/Query, затем полные typecheck, lint, styles, format, Vitest, integration, Query, production E2E. Playwright запускать последовательно.
6. Повторный read-only analyze, `git diff --check`, review, commit/push `refactor`, обе CI jobs на кодовом SHA; обновить roadmap/spec/verification и проверить итоговый SHA.

Новых пакетов, реальных реквизитов и серверных API нет.
