# Проверки 051

Корень репозитория, ветка `refactor`, существующие зависимости. Пакеты не устанавливаются.

1. Baseline: 050 `npm run test:integration` 366/366 и успешные CI jobs. Сверить [inventory](inventory.md) и [scenario-map.json](scenario-map.json) с `playwright.integration.config.ts --list --reporter=json`.
2. После копирования, до удаления старых: `npm run test:integration` (новый Vitest project после изменения скрипта) либо `npx vitest run --project integration`; отдельно `npx playwright test --config playwright.integration.config.ts`. Оба должны сохранить 366 сценариев и ключевые G01–G08. Сравнить discovery JSON после переноса по точным title/path/ID.
3. После удаления старого runner: `npm run typecheck`, `npm run lint`, `npm run lint:styles`, `npm run format:check`, `npm test`, `npm run test:unit`, `npm run test:integration`, `npm run test:component`; браузерные `npm run test:query` и `npm run test:e2e` последовательно.
4. Краткий отрицательный контроль важного assertion с гарантированным восстановлением файла; `git diff --check`, пофайловое review и контроль отсутствия старой конфигурации/неучтённых тестов.
5. Commit/push `refactor`, проверить обе CI jobs и артефакты точного SHA; затем обновить roadmap/spec/tasks/verification и повторно проверить документационный SHA.

Passed/Failed/Blocked/NotRun фиксировать отдельно. Число 366 необходимо для механической сверки, но не заменяет сохранение смысла G01–G08.
