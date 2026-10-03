# Quickstart 046

1. Установить SPECIFY_FEATURE_DIRECTORY = D:/Pet-projects/green-api-chat/specs/046-recipient-search-model, проверить точный FEATURE_DIR через prerequisites с ExpectedFeatureDirectory.
2. Сверить baseline (7 integration, 10 browser), spec/research/model/contract/plan/tasks и карту 035; провести read-only analyze, записать analysis.md отдельным действием.
3. Добавить RTL тест отмены запроса при unmount, подтвердить поведенческий Red; перенести model/server/ui, браузерные adapter/hook, обновить входы/CSV/тесты, выполнить Green и Refactor.
4. Проверить unit/RTL, оба режима, ошибки/401, выбор/подпись и отсутствие отправки; затем полный typecheck/lint/styles/format/Vitest/integration/Query/E2E, server/client graph.
5. Повторить read-only analyze и review, commit/push refactor, подтвердить обе CI jobs кода и финального документационного SHA. Пакеты не устанавливать.
