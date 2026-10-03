# Проверка 030

Установки не нужны. Из корня проекта:

~~~powershell
npm test
npm run typecheck
npm run typecheck:tests
npm run lint
npm run lint:styles
npm run format:check
npm run test:query -- tests/query/chat-query.spec.ts
~~~

NODE_ENV задаёт Vitest; production NODE_ENV для component-набора недопустим.
Сеть полностью фиктивная. Playwright самостоятельно собирает и запускает query-app.
Для чувствительности временно заменить reactStrictMode: true на false в React harness component-теста:
тест replay обязан упасть на setup/cleanup/setup; после восстановления запустить
итоговый набор. Это проверка теста, не TDD нового продукта.

Результаты, ограничения и предкоммитное ревью: [verification.md](verification.md).
