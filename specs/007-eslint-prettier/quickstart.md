# Quickstart: ESLint и Prettier

Все npm-скрипты доступны через ▶ в NPM Scripts VS Code.

1. lint и format:check проверяют код без изменения файлов.
2. lint:fix исправляет готовые ESLint-нарушения; затем format выравнивает представление.
3. typecheck проверяет типы, включая приложение и тесты.
4. test:integration проверяет серверную логику на фиктивных данных.
5. test:e2e собирает приложение и проверяет браузерное поведение; перед запуском
   остановить dev в этой папке.

Для терминала:

```powershell
npm run lint:fix
npm run format
npm run lint
npm run format:check
npm run typecheck
npm run test:integration
npm run test:e2e
```

После git clone использовать npm ci. Зависимость eslint-plugin-import
объявлена напрямую для воспроизводимого подключения правил.
Настоящие реквизиты не нужны для автоматических проверок.
Общий check появится в отдельной согласованной задаче.
