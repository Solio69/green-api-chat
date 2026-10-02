# Quickstart: список чатов и Query

Дата: 2026-10-02. Команды проверки реализованного слоя; результаты запусков — verification.md. Каталог проекта: D:\Pet-projects\green-api-chat.

## До реализации

1. Пользователь разрешает реализацию по полному kit/analysis.
2. Сверить текущие shared файлы по contracts/ui-integration.md и очередность с соседней работой; сохранить staged изменения.
3. Пользователь проверяет пакет и устанавливает согласованную зависимость. Агент не устанавливает пакеты:

```powershell
Set-Location 'D:\Pet-projects\green-api-chat'
npm view @tanstack/react-query@5.104.0 version peerDependencies
npm install --save-exact @tanstack/react-query@5.104.0
```

Ожидание: версия 5.104.0, поддержка React 19, запись exact версии в package.json и lock. При отсутствии/конфликте остановить зависимый шаг, зафиксировать Blocked, обновить техническое решение. Установка не означает готовую интеграцию. Devtools/query-core/test packages не нужны. Если Chromium отсутствует, штатную npm run test:install-browser также выполняет пользователь.

## TDD и стенд

Fixture конфигурация и минимальные compilable exports предшествуют тестам; production UI ещё не подключается. После написания постоянных новых tests и регистрации маршрута выполнить один Red набор:

```powershell
npm run test:integration -- tests/integration/chats-api.spec.ts tests/integration/chat-query.spec.ts
npm run test:query
npm run test:e2e -- tests/e2e/chats-api.spec.ts
```

test:query — script playwright test --config playwright.query.config.ts. Fixture next build tests/fixtures/query-app --webpack и next start tests/fixtures/query-app на 127.0.0.1:3102 запускаются конфигом. Основной E2E runner сам собирает/запускает продукт на 3101 с фиктивным SESSION_PASSWORD и fake-green-api. Тесты последовательны, реальные API не вызываются. Query использует list reporter и результаты test-results/query, .next fixture отдельный. Остановить dev-server того же checkout перед production build/E2E, не смешивать root .next процессы.

Неправильная сборка, отсутствующий импорт, неверная cookie-фикстура или browser — инфраструктурный Blocked. Для Red нужны успешный запуск тестовой инфраструктуры и failures ожидаемого поведения (неполученный список, отсутствие дедупликации/очистки и т.п.). Причины фиксируются в verification.md.

## Green и итоговые проверки

После всей серии реализации T005–T008 повторить три адресных команды выше для Green. После Refactor провести итоговую проверку:

```powershell
npm run typecheck
node node_modules/typescript/bin/tsc --noEmit --project tests/fixtures/query-app/tsconfig.json
npm run lint
npm run lint:styles
npm run format:check
node node_modules/prettier/bin/prettier.cjs --ignore-path NUL --check "specs/014-chat-list-query/**/*.md"
npm run test:integration
npm run test:query
npm run test:e2e
```

Fixture build и основная production build выполняются browser runners; отдельно дублировать npm run build без новых причин не нужно. Штатный format:check исключает specs; отдельная команда проверяет именно документы 014. Root typecheck уже включает новые integration/e2e TS; tests/query входят в отдельный fixture tsconfig include вместе с playwright.query.config.ts и tests/chats/helpers.ts. Не изменять root tsconfig ради nested .next. Проверить с изолированным ожидаемым lint примером, что fixture source остаётся под правилами, generated .next игнорируется. Контрактный Red этого lint правила не нужен: сам проектный rule не меняется.

## Ручная приёмка пользователем

После автоматических Green и без передачи реквизитов агенту: обычный вход, серверный профиль, поиск/выход; через подключённый тестируемый потребитель или уже интегрированный UI получить личные чаты настоящего аккаунта. UI подключён в 015: проверить список на главной по [015 quickstart](../015-chat-workspace-ui/quickstart.md). Публичный hook дополнительно принимается fixture тестами. Проверить empty/подписи по фактическим данным. Отдельно обновить страницу и выйти/войти в другой аккаунт: старые чаты не становятся данными нового подключения. Результат реального API, если не выполнен, остаётся NotRun.

Git staging/commit/push, публикация и изменения Telegram этим сценарием не выполняются. Предлагаемое имя коммита после приёмки: feat: add personal chat queries with isolated cache.
