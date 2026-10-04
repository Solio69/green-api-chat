# Проверки 050

Запускать из корня репозитория в ветке `refactor`. Playwright конфигурации последовательно: они используют общие build/output пути.

1. Исходная опора: успешный CI SHA 049; локально затронутые `npm run test:query -- --grep ...` и `npm run test:e2e -- --grep ...` до изменения.
2. Контроль test infrastructure Red/Green: добавить сценарий, намеренно оставляющий state при ошибке либо повторный account сценарий; подтвердить именно загрязнение при прежней общей fixture и очистку после правки. Не сохранять намеренно падающий пример.
3. `npm run typecheck`; `npm run lint`; `npm run lint:styles`; `npm run format:check`; `npm run test`.
4. `npm run test:integration`; `npm run test:query`; `npm run test:e2e` последовательно.
5. Выборочно `npx playwright test --config playwright.query.config.ts <file>` и `npx playwright test --config playwright.config.ts <file> --repeat-each=2`; те же файлы в ином порядке команд; изменение oracle временно должно падать по утверждению, затем быть отменено.
6. Проверить `git diff --check`, секреты, отсутствие новых product routes/dependencies, `git status`; затем commit/push и обе CI jobs с артефактами.

Passed/Failed/Blocked/NotRun отмечать отдельно в verification. Непрошедшая обязательная проверка не позволяет отметить задачу завершённой.
