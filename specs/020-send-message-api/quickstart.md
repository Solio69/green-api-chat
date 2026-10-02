# Quickstart: проверка серверной отправки

**Статус**: Completed / CodeAuthorized. Автоматическая приёмка PassedSynthetic; реальный инстанс Operator NotRun. Доказательства: [verification](verification.md).
Каталог проекта: D:\Pet-projects\green-api-chat. Новые пакеты не нужны.

1. Проверить фактический diff и зависимости: сессия 014, shared SessionQueryError
   018 и runtime/proof 022/023. При незавершённом runtime независимые adapter
   тесты используют injected guard; это не готовая интеграция рабочего чата.
2. После разрешения написать тесты в tests/integration/send-message.spec.ts;
   запуск Red/Green одним и тем же точным набором:

```powershell
npm run test:integration -- tests/integration/send-message.spec.ts
```

3. HTTP контракт, cookie, single send и чужая вкладка:

```powershell
npm run test:e2e -- tests/e2e/message-composer.spec.ts
```

4. После рефакторинга один итоговый набор, с регрессией прежних server contracts:

```powershell
npm run test:integration
npm run test:e2e -- tests/e2e/message-composer.spec.ts tests/e2e/chats-api.spec.ts tests/e2e/recipient-search.spec.ts
npm run typecheck
npm run lint
npm run format:check
node node_modules/prettier/bin/prettier.cjs --check --ignore-path NUL specs/020-send-message-api
```

Общий format:check охватывает source, tests и изменяемые shared constants/fixtures;
отдельная команда --ignore-path NUL включает исключённые по умолчанию feature docs.

Команда send integration уже исполнена; команды будущих HTTP файлов пока не исполняются. Red должен падать
на согласованном поведении (например, accepted вместо ошибочного результата),
не на импорте или отсутствующем браузере. Type-compatible каркас допускается
после разрешения кода; production run не подменяет поведенческий Red.

HTTP fixture расширяет существующий fake-green-api.ts только send-сценариями;
реальных запросов/секретов нет. Fixture claim/stream использует контракт 022/023.
Не передавать capability/токен в URL, stdout, скриншоты или записанный trace.

Для ручной отправки пользователь открывает одну рабочую вкладку, выбирает
фиктивные/разрешённые тестовые данные и сам выполняет отправку после готовности 021. Пока 021 не готова, серверный тест не объявляет пользовательский сценарий
закрытым. Не создавать коммит, не устанавливать пакеты и не менять кабинет.
