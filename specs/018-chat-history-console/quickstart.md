# Quickstart: проверка 018 после разрешения кода

**Сейчас**: реализация и автоматические проверки завершены; серверный/React Red и общий Green подтверждены. Фактические итоги — в verification.md; реальный инстанс вручную не проверялся.
Нужны установленные пользователем зависимости, Node 24 и существующий Playwright.
Настройки/реальные сообщения не помещать в фикстуры. Подготовка не устанавливает ПО.

## TDD

Из корня проекта последовательно:

```powershell
npm run test:integration -- tests/integration/history-api.spec.ts
npm run test:integration -- tests/integration/history-query.spec.ts tests/integration/chat-query.spec.ts
npm run test:query -- tests/query/history-query.spec.ts
npm run test:e2e -- tests/e2e/history-api.spec.ts
```

Для новой логики сначала запуск Red с отсутствующим целевым поведением,
затем минимальный Green и Refactor. Handler/provider/query/controller прошли
этот порядок; actual route E2E добавлен после handler Red как регрессия/wiring.
При повторной проверке готового кода искусственный Red не создаётся.
Существующая фикстура должна запускаться;
ошибка импорта, отсутствие браузера или сервера не являются Red. Тесты сохраняются.

## Итог

```powershell
npm run typecheck
npm run lint
npm run format:check
npm run test:integration -- tests/integration/history-api.spec.ts tests/integration/history-query.spec.ts tests/integration/chat-query.spec.ts
npm run test:query -- tests/query/history-query.spec.ts tests/query/chat-query.spec.ts
npm run test:e2e -- tests/e2e/history-api.spec.ts tests/e2e/chats-api.spec.ts tests/e2e/logout-flow.spec.ts
node node_modules/prettier/bin/prettier.cjs --check --ignore-path NUL specs/018-chat-history-console
```

E2E штатно строит приложение; отдельную повторную сборку без причины не добавлять.
Проверка стилей нужна только при их изменении; 018 не меняет стили.
Общий format:check охватывает исходники и тесты, но игнорирует specs/docs.
Поэтому отдельная команда документации с --ignore-path NUL остаётся обязательной.
Фактические команды, причину Red, результаты Green и ограничения записать в verification.md.

## Ручная приёмка

025 реализована: выбрать A/B/A и повторно открыть тот же чат. В тестовой среде проверить
POST истории и серверный count: 10 фиктивного поставщика. Консоль показывает
свежий ответ, а Query сохраняет объединённые сообщения. Мобильный возврат
не меняет выбор; закрытие переписки не удаляет кеш. Проверить, что ответ,
пришедший после выхода, не публикуется и не восстанавливает данные.
Настоящая история допустима в локальной консоли по явной просьбе пользователя,
но не переносится в verification, скриншоты, документы и тестовые фикстуры.
