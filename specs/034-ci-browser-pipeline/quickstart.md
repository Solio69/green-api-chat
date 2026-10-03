# Запуск и приёмка 034

Локальные команды из корня репозитория, браузер установлен ранее:

~~~powershell
npm run typecheck
npm run lint
npm run lint:styles
npm run format:check
npm test
npm run test:query -- --output=test-results/query
npm run test:e2e -- --output=test-results/e2e
~~~

До исправления фокуса — только целевой Red:

~~~powershell
npm run test:e2e -- tests/e2e/conversation-selection.spec.ts --grep "observer delivery" --reporter=list --output=test-results/034-focus-red
~~~

После исправления — целевой тест и повтор B028-E-0026, затем полный набор.
Query/E2E выполнять последовательно: сборки разные, но тестовые webServer
и порты не должны конкурировать с локальными процессами.
На GitHub browser job сам выполняет npm ci и npx playwright install
--with-deps chromium. Запуск на фиктивных данных.
Quality и browser job, artifact и head_sha проверяются через Actions.
Приёмка positive/negative/restore записывается в verification.md.
