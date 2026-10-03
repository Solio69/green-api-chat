# Проверка 032

~~~powershell
npm run lint
npm run typecheck
npm run lint:styles
npm run format:check
npm test
npm run test:integration
npm run test:query
npm run test:e2e -- tests/e2e/login-flow.spec.ts tests/e2e/login-form-safety.spec.ts tests/e2e/login-form.spec.ts tests/e2e/logout-flow.spec.ts tests/e2e/recipient-search.spec.ts tests/e2e/recipient-search-ui.spec.ts tests/e2e/message-composer.spec.ts tests/e2e/chat-list-ui.spec.ts
~~~

До итогового lint проверить временные valid/invalid/explicit void примеры
реальным ESLint config. Использовать пути внутри соответствующих TS-проектов,
после проверки восстановить состояние. Ошибка parser/project не считается
доказательством работающего правила. JS config тоже должен пройти lint.
Фактические результаты: verification.md.
