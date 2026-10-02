# Проверка статусы доставлено/прочитано/отказ

**Сейчас**: docs only, CodeNotAuthorized. Ниже команды будущей реализации; тесты NotRun.

## Предварительные условия

019 normalized model/cache/early facts source of truth;022 validates envelope,022 validates status по spec024,023 consumes safe DTO,020/021 acceptance separate. MessageBubble/ChatHistoryPanel созданы 019;024 использует их status/error slots, сохраняет макет/styles, не создаёт новую страницу. Required toggles пользователь включает вручную.

Использовать существующие Node 24/npm11 и node_modules. Ничего не устанавливать; если окружение отсутствует, сообщить пользователю и остановить зависимые проверки. .env/credentials не копировать в spec/fixtures/output.

## TDD и итоговые команды

Из `D:\Pet-projects\green-api-chat`: сначала точный test из tasks и behavioral Red, потом implementation/Green, потом refactor и повтор проверок. Пример целевой команды:

```powershell
npm run test:integration -- tests/integration/message-statuses.spec.ts
npm run typecheck
npm run lint
npm run format:check
npm run build
```

Browser commands/fixtures точно заданы в tasks; не использовать реальное удаление уведомлений в test. Состояния Passed/Failed/Blocked/NotRun иповеденческуюпричину Red записатьв verification.md после кода, не заранее.

## Операторские действия и ручные сценарии

- Пользователь проверяет outgoingMessageWebhook, outgoingAPIMessageWebhook, outgoingWebhook включены, webhookUrl пустой. IncomingWebhook требуется 022. Агент не вызывает SetSettings.
- На fake provider показать HTTP accepted отдельно от delivered/read; failure без id даёт общую ошибку без изменения случайной bubble; noAccount не утверждает отсутствие аккаунта.
- Рестарт/TTLearlyfact может потерять неподтверждённый текстом статус; history count 10 не является полным журналом.

Проверка особенностей proxy/settings — перед фактическим run, неусловиеготовности документов. Пользователь изменяет remote toggles вручную; agent не выполняет SetSettings/ClearQueue/ReadChat. Нет дополнительных пакетов или миграций.

## Завершение

Сверить acceptance/coverage/tasks, посмотреть итоговый source diff без Git mutations, сохранить verification с фактами/review/рисками. Предложенное английское название коммита: `Apply confirmed message delivery statuses without identity guesses`; agent сам commit/stage не вызывает. Следующийэтап — frozen read-only analyze и полный отчёт перед отдельной code authorization.

Общий порядок небольших шагов:025→018→019→022→023→020→021→024. Проверки сквозного результата последующего шага остаются NotRun до его реализации; stubbed fake sink позволяет независимо проверить core022.
