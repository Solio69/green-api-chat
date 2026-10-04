# Контракт тестового runtime

## Запуск и границы

npm test выполняет оба проекта один раз; test:unit и test:component выбирают node/dom; test:watch наблюдает изменения. Фильтры имени и пути доступны штатным CLI. Пустой выбранный набор или нарушенное ожидание завершается ненулевым кодом. globals=false, allowOnly=false, retry=0; ошибки не маскируются retries.

Node include не захватывает React/E2E; DOM include не захватывает Node/Playwright. Alias @/ указывает на src. SCSS Modules загружаются существующим Sass через Vite. Этот запуск не доказывает геометрию и настоящий браузерный фокус.

## Изоляция

После DOM-теста RTL удаляет mounted tree и React effects. Затем оставшиеся fake timers очищаются без выполнения callback и возвращаются реальные таймеры. Перед следующей проверкой Vitest сбрасывает mocks, восстанавливает spies и vi.stubGlobal/vi.stubEnv. Подмена fetch в тестах делается штатным vi.stubGlobal/spyOn, без незаметного присваивания глобалу.

createTestQueryClient вызывается внутри теста, создаёт отдельный client с retry=false/gcTime=Infinity и регистрирует onTestFinished(clear). Кеш и pending query не переживают тест. Тесты не используют общий application QueryClient.

Проверки runtime специально используют последовательные пары «оставить ресурс → убедиться в очистке». Обычные продуктовые тесты не зависят от порядка и не используют singleton-кеш.

## Пилот и ошибки

Recipient-label сохраняет обе исходные нормализованные подписи и исходные parsed query. RecipientSearchResult сохраняет независимые ожидаемые тексты и фиктивного получателя; action проверяется user-event и вызовом callback. Browser contract остаётся отдельным.

Контролируемое неверное ожидание должно дать assertion failure и exit 1, после его восстановления тест проходит. Ошибки установки или импорта не считаются успешной проверкой этого контракта.
