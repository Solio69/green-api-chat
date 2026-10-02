# Проверка серверный получатель уведомлений

**Статус**: Completed / CodeAuthorized. Автоматическая приёмка PassedSynthetic; реальный инстанс Operator NotRun. Доказательства: [verification](verification.md).

## Предварительные условия

018 QuerySession/public auth errors и existing cookie; normalized cache019 и status enum024 (server normalizer022) — согласованные DTO.022 pure runtime допустимо проверить с typed fake sink до 023; browser end-to-end acceptance022 завершена после023: PassedSynthetic.020/021 consumes tryAcquireSend, не создаёт owner альтернативно.023 routes интегрируют этот runtime после своего разрешения;025 selection не влияет на reader.

Использовать существующие Node 24/npm11 и node_modules. Ничего не устанавливать; если окружение отсутствует, сообщить пользователю и остановить зависимые проверки. .env/credentials не копировать в spec/fixtures/output.

## TDD и итоговые команды

Из `D:\Pet-projects\green-api-chat`: сначала точный test из tasks и behavioral Red, потом implementation/Green, потом refactor и повтор проверок. Пример целевой команды:

```powershell
npm run test:integration -- tests/integration/notification-owner.spec.ts tests/integration/notification-receiver.spec.ts tests/integration/notification-normalization.spec.ts
npm run typecheck
npm run lint
npm run format:check
npm run build
```

Browser commands/fixtures точно заданы в tasks; не использовать реальное удаление уведомлений в test. Состояния Passed/Failed/Blocked/NotRun иповеденческуюпричину Red записатьв verification.md после кода, не заранее.

## Операторские действия и ручные сценарии

- Настройки: webhookUrl пустой, incomingWebhook включён; дополнительно исходящие toggles024 для status acceptance. Агент не меняет настройки.
- Две вкладки одного instance: second limited/send denied; explicit retry после release/drain. Один constant Node process, никакого horizontal scaling.
- На fake provider разорвать stream до ACK: нет Delete; после ACK возможна потеря удалённого события при reload, полнота не обещается.

Проверка особенностей proxy/settings — перед фактическим run, неусловиеготовности документов. Пользователь изменяет remote toggles вручную; agent не выполняет SetSettings/ClearQueue/ReadChat. Нет дополнительных пакетов или миграций.

## Завершение

Сверить acceptance/coverage/tasks, посмотреть итоговый source diff без Git mutations, сохранить verification с фактами/review/рисками. Предложенное английское название коммита: `Add single-instance notification receiver and processed ACK lifecycle`; agent сам commit/stage не вызывает. Итоговый frozen read-only analyze и полный отчёт сохранены отдельно; следующий шаг — ручное ревью и операторская проверка. Повторная code authorization не требуется.

Общий порядок небольших шагов:025→018→019→020 core→022→023→020 HTTP→021→024. Сквозные проверки020–024 выполнены с fake provider; независимые core тесты сохранены. Настоящий GREEN-API не использовался.
