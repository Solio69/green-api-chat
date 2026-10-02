# Quickstart: отправка из формы

**Статус**: будущие действия после отдельного разрешения кода; NotRun.

До интеграции нужны готовые контракты/реализация: selection 025, scope/error
lifecycle 018, message cache и session-chat facts 019, Send API 020, owner 022/023.
Компонентный стенд может инжектировать fake transport/owner, не обходя реальные
контракты. Сначала проверить актуальные UI/staging, не копировать старый mock DOM.

После разрешения кода — Red/Green для чистых guards/client parsing:

```powershell
npm run test:integration -- tests/integration/message-send.spec.ts
```

Real React/provider/composer Red/Green:

```powershell
npm run test:query -- tests/query/message-composer.spec.ts
```

Проверка поиска → первого принятого чата и полного HTTP/owner пути:

```powershell
npm run test:e2e -- tests/e2e/message-composer.spec.ts
```

Итог после всех правок/рефакторинга:

```powershell
npm run test:integration -- tests/integration/message-send.spec.ts tests/integration/chat-query.spec.ts
npm run test:query -- tests/query/message-composer.spec.ts tests/query/chat-query.spec.ts
npm run test:e2e -- tests/e2e/message-composer.spec.ts tests/e2e/chat-list-ui.spec.ts tests/e2e/chat-workspace.spec.ts tests/e2e/recipient-search-ui.spec.ts
npm run typecheck
npm run lint
npm run lint:styles
npm run format:check
node node_modules/prettier/bin/prettier.cjs --check --ignore-path NUL specs/021-message-composer
```

Общий format:check включает source, tests, новые query fixture и изменяемые
workspace/fixtures; отдельная --ignore-path NUL команда проверяет feature docs.

До появления этих файлов команды не исполняются. Red должен подтверждать
нужное поведение; ошибка импортов/build/browser не считается Red. Новых пакетов
не устанавливать. Existing query fixture build/start уже использует Playwright.

Ручная проверка пользователем после готовности: Enter/Shift+Enter, длинный
многострочный текст, исходные пробелы, pending → переключение/close, первая
отправка найденному получателю, второй заблокированный tab. Для unknown использовать
fake provider; агент не создаёт реальные сообщения ради теста.
Ширины 320/1280, клавиатура/IME и отсутствие редизайна проверяются по макету.
Секреты, capability и настоящая переписка не попадают в trace/скриншоты/журналы.
