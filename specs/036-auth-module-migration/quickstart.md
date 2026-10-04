# Приёмка 036

До изменений: зафиксировать baseline целевых tests/integration и
tests/e2e на текущем CI и выполнить read-only анализ комплекта.
Чистый перенос не требует искусственного Red. После изменений:

~~~powershell
npm run typecheck
npm run lint
npm run lint:styles
npm run format:check
npm run test:unit
npm run test:integration -- tests/integration/session.spec.ts tests/integration/auth-flow.spec.ts tests/integration/home-flow.spec.ts tests/integration/login-route.spec.ts tests/integration/chats-api.spec.ts
npm run test:query
npm run test:e2e
~~~

Query/E2E выполнять последовательно из-за webServer и каталогов
сборки. Проверить `rg` по пяти старым путям и по import client→
auth/server; `src/lib/auth/session.ts` остаётся до 037. CI должен
завершить обе jobs success на опубликованном commit. Критические
контракты: 24 часа/HttpOnly/SameSite/Secure, отказ провайдера без
потери сессии, logout и Query cleanup.
