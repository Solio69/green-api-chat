# Проверка sse доставка и query обработка

**Сейчас**: docs only, CodeNotAuthorized. Ниже команды будущей реализации; тесты NotRun.

## Предварительные условия

022 runtime/normalizer/owner approved и реализованный к моменту backend integration;018 Query public session/cleanup/error contract;019 shared message cache/session chat overlay;019 pure reducer/issue helpers по правилам spec024;025 selection recovery subscription. Wrapper держит SSR slots,021 sender uses internal scoped owner headers. Shared source files меняются последовательными feature steps, parallel docs не разрешают parallel editing этих файлов.

Использовать существующие Node 24/npm11 и node_modules. Ничего не устанавливать; если окружение отсутствует, сообщить пользователю и остановить зависимые проверки. .env/credentials не копировать в spec/fixtures/output.

## TDD и итоговые команды

Из `D:\Pet-projects\green-api-chat`: сначала точный test из tasks и behavioral Red, потом implementation/Green, потом refactor и повтор проверок. Пример целевой команды:

```powershell
npm run test:integration -- tests/integration/notification-api.spec.ts tests/integration/notification-stream.spec.ts tests/integration/notification-client.spec.ts
npm run typecheck
npm run lint
npm run format:check
npm run build
```

Browser commands/fixtures точно заданы в tasks; не использовать реальное удаление уведомлений в test. Состояния Passed/Failed/Blocked/NotRun иповеденческуюпричину Red записатьв verification.md после кода, не заранее.

## Операторские действия и ручные сценарии

- Под fake provider выбрать B, доставить A: B не переключается, unknownA сразу display actual label/chatId; GetChats error не удаляет row/message.
- Отключить stream и вернуть: canSend=false→reconnect, history count 10 выбранногочата, нет обещания полного replay. Вторая вкладка explicit limited и серверный Send deny.
- Один Node process; при proxy отключить buffering. Реальный прием/удаление запускается только после отдельной code/run авторизации.

Проверка особенностей proxy/settings — перед фактическим run, неусловиеготовности документов. Пользователь изменяет remote toggles вручную; agent не выполняет SetSettings/ClearQueue/ReadChat. Нет дополнительных пакетов или миграций.

## Завершение

Сверить acceptance/coverage/tasks, посмотреть итоговый source diff без Git mutations, сохранить verification с фактами/review/рисками. Предложенное английское название коммита: `Connect scoped SSE notifications to shared chat query facts`; agent сам commit/stage не вызывает. Следующийэтап — frozen read-only analyze и полный отчёт перед отдельной code authorization.

Общий порядок небольших шагов:025→018→019→022→023→020→021→024. Проверки сквозного результата последующего шага остаются NotRun до его реализации; stubbed fake sink позволяет независимо проверить core022.
