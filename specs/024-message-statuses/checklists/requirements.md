# Specification Quality Checklist: Статусы исходящих сообщений

**Purpose**: Качество требований до реализации.
**Created**: 2026-10-02
**Feature**: [spec.md](../spec.md)
**Kind**: Readiness
**Readiness**: Ready — spec Approved 2026-10-02; plan/tasks подготовлены, CodeAuthorized.

## Content Quality

- [x] CHK001 Сценарии показывают фактический исход отправки и не приписывают ошибку произвольному сообщению — User Story 1/2.
- [x] CHK002 Provider enum и отсутствие idMessage в примерах отделены от проектных предложений; конкретная механика ранних статусов и конфликтов оставлена research/plan при явных требованиях достоверного сопоставления и отсутствия регрессии.

## Requirement Completeness

- [x] CHK003 Q-STATUS-01 согласован: общая ошибка соответствующего чата/подключения, без изменения произвольной bubble. Q-STATUS-02/03 не требуют отдельного продуктового gate: FR-004/007/008 определяют корректность, техническую механику уточнит research/plan.
- [x] CHK004 Есть повторы, read → delivered, раннее событие, noAccount/failed без idMessage, ошибки потока, scope и влияние ручных настроек — FR-001–013, Edge Cases.
- [x] CHK005 SC-001–005 связаны с FR; SendMessage acceptance не объявлено доставкой, noAccount учитывает приватность номера.

## Feature Readiness

- [x] CHK006 User Approval получено 2026-10-02; CodeAuthorized, реализация разрешена.
- [x] CHK007 Нет автоматического SetSettings/ReadChat/повтора отправки или нового постоянного хранилища; зависимости 019–023 обозначены.
- [x] CHK008 Описан будущий TDD, проверки реализации NotRun; фактические настройки аккаунта не проверены.

## Notes

- 13 FR и 5 SC; 2 истории. Это проверка качества требований, а не acceptance выполнения.
- 2026-10-02 проверена документация Telegram OutgoingMessageStatus: delivered/read/failed/noAccount; примеры failed/noAccount могут не содержать idMessage. Это нельзя маскировать правилом «все статусы обязаны иметь idMessage».
- Документация указывает outgoingMessageWebhook, outgoingAPIMessageWebhook, outgoingWebhook для статусов. Их изменение остаётся действием пользователя; название Webhook не переключает выбранный транспорт на webhook Endpoint.
- setup-spec и RequireSpec прошли для точного каталога 024; plan/tasks подготовлены, frozen analyze следующий этап; код не создавался.
