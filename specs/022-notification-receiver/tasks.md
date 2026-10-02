# Tasks: Серверный получатель уведомлений

**Input**:[spec](spec.md),[plan](plan.md),research/data-model/contracts/quickstart.
**Spec Approved**:2026-10-02. **Implementation**: CodeNotAuthorized; все задачи NotRun.
Пути относительны корню проекта. Работа строго последовательно, без параллельных source изменений.

## Проверяемые этапы

- [ ] T001 [US1] Право и lifecycle: Red. Написать постоянные тесты в `tests/integration/notification-owner.spec.ts`: одновременные scopes/токены одного инстанса, expiry, grace, generation, deny Send второй вкладке, in-flight drain и active capability logout revoke/inactive cannot revoke/multi-route shared registry. Запустить `npm run test:integration -- tests/integration/notification-owner.spec.ts`, подтвердить поведенческое падение, а не missing import/окружение. Минимальный нейтральный typechecked seam при новом module допустим лишь для запуска контракта; бизнес-поведение до Red не внедрять. Зависимость: нет, соответствующие feature prerequisites из plan.
- [ ] T002 [US1] Право и lifecycle: Green. После подтверждения предшествующего Red реализовать `src/lib/notifications/receiver-registry.ts`, `src/app/api/auth/logout/route.ts` и необходимые types/constants из plan. Точная обязанность: одновременные scopes/токены одного инстанса, expiry, grace, generation, deny Send второй вкладке, in-flight drain и active capability logout revoke/inactive cannot revoke/multi-route shared registry. Запустить ту же команду, получить Green; реальные provider calls исключить. Зависимость: T001.
- [ ] T003 [US1] Право и lifecycle: Refactor. Сохранить и упростить реализацию/fixtures предыдущей группы, не ослаблять assertions; повторить `npm run test:integration -- tests/integration/notification-owner.spec.ts` + `npm run typecheck`. Pure refactor основывается на подтверждённом Green. Зависимость: T002.
- [ ] T004 [US1] Очередь и удаление: Red. Написать постоянные тесты в `tests/integration/notification-receiver.spec.ts`: Receive max1, null noDelete, noACK noDelete, arbitrary ACK reject, pending replay, lost/false Delete HEAD same/different/empty, retries/backoff/rate/pause. Запустить `npm run test:integration -- tests/integration/notification-receiver.spec.ts`, подтвердить поведенческое падение, а не missing import/окружение. Минимальный нейтральный typechecked seam при новом module допустим лишь для запуска контракта; бизнес-поведение до Red не внедрять. Зависимость: T003.
- [ ] T005 [US1] Очередь и удаление: Green. После подтверждения предшествующего Red реализовать `src/lib/notifications/receiver-loop.ts, src/lib/green-api/receive-notification.ts, src/lib/green-api/delete-notification.ts` и необходимые types/constants из plan. Точная обязанность: Receive max1, null noDelete, noACK noDelete, arbitrary ACK reject, pending replay, lost/false Delete HEAD same/different/empty, retries/backoff/rate/pause. Запустить ту же команду, получить Green; реальные provider calls исключить. Зависимость: T004.
- [ ] T006 [US1] Очередь и удаление: Refactor. Сохранить и упростить реализацию/fixtures предыдущей группы, не ослаблять assertions; повторить `npm run test:integration -- tests/integration/notification-receiver.spec.ts` + `npm run typecheck`. Pure refactor основывается на подтверждённом Green. Зависимость: T005.
- [ ] T007 [US2] Нормализация: Red. Написать постоянные тесты в `tests/integration/notification-normalization.spec.ts`: GetSettings preflight с непубликованной reservation/config release; status DTO failed без id/unknown enum; instance/Telegram/chat identity, text/extendedtext/unsupported, ignored осознанный ACK, malformed pause/noDelete, отсутствие credential/raw/wid/phone. Запустить `npm run test:integration -- tests/integration/notification-normalization.spec.ts`, подтвердить поведенческое падение, а не missing import/окружение. Минимальный нейтральный typechecked seam при новом module допустим лишь для запуска контракта; бизнес-поведение до Red не внедрять. Зависимость: T006.
- [ ] T008 [US2] Нормализация: Green. После подтверждения предшествующего Red реализовать `src/lib/notifications/normalize-notification.ts`, `src/lib/notifications/normalize-message-status.ts`, `src/lib/green-api/get-notification-settings.ts` и необходимые types/constants из plan. Точная обязанность: GetSettings preflight с непубликованной reservation/config release; status DTO failed без id/unknown enum; instance/Telegram/chat identity, text/extendedtext/unsupported, ignored осознанный ACK, malformed pause/noDelete, отсутствие credential/raw/wid/phone. Запустить ту же команду, получить Green; реальные provider calls исключить. Зависимость: T007.
- [ ] T009 [US2] Нормализация: Refactor. Сохранить и упростить реализацию/fixtures предыдущей группы, не ослаблять assertions; повторить `npm run test:integration -- tests/integration/notification-normalization.spec.ts` + `npm run typecheck`. Pure refactor основывается на подтверждённом Green. Зависимость: T008.
- [ ] T010 Операторские условия и завершение acceptance: документировать проверенные settings/runtime предусловия в `specs/022-notification-receiver/verification.md`; выполнить ручные fake сценарии quickstart/checklists, не менять remote настройки. Зависимость:T009. Основание: FR-013.
- [ ] T011 Сверить весь diff со spec и coverage, выполнить подходящий integration/query набор +typecheck/lint/format/build из plan; провести предкоммитное ревью и записать actual commands/results/Red/Green/risks в `specs/022-notification-receiver/verification.md`. Обновить tasks/acceptance только по evidence; Gitmutations не выполнять. Зависимость:T010. Это завершение всех FR/SC, не новое product behavior.

## Dependencies & Execution Order

T001→T002→T003→T004→T005→T006→T007→T008→T009→T010→T011. Каждая Green ждёт фактического behavioral Red, каждый refactor — Green. Все source paths/constants/tests из plan входят в ближайшую соответствующую Green группу; новые types сами по себе недостаточное доказательство Red. 018 QuerySession/public auth errors и existing cookie; normalized cache019 и status enum024 (server normalizer022) — согласованные DTO.022 pure runtime допустимо проверить с typed fake sink до 023; browser end-to-end acceptance блока 022 остаётся NotRun до 023.020/021 consumes tryAcquireSend, не создаёт owner альтернативно.023 routes интегрируют этот runtime после своего разрешения;025 selection не влияет на reader.

Baseline ранее реализованных dependencies подтвердить перед изменением общего helper; не запускать тесты всего repo после каждого строчного исправления. Runtime tests не запускаются сейчас. Browser fixture изменений статуса — только observability, никакой редизайн.

## Coverage

| Требование/критерий | Задачи                                         |
| ------------------- | ---------------------------------------------- |
| FR-001              | T004, T005, T006, T010, T011                   |
| FR-002              | T001, T002, T003, T007, T008, T009, T010, T011 |
| FR-003              | T001, T002, T003, T010, T011                   |
| FR-004              | T004, T005, T006, T010, T011                   |
| FR-005              | T004, T005, T006, T010, T011                   |
| FR-006              | T004, T005, T006, T010, T011                   |
| FR-007              | T004, T005, T006, T010, T011                   |
| FR-008              | T004, T005, T006, T010, T011                   |
| FR-009              | T007, T008, T009, T010, T011                   |
| FR-010              | T001, T002, T003, T010, T011                   |
| FR-011              | T001, T002, T003, T010, T011                   |
| FR-012              | T007, T008, T009, T010, T011                   |
| FR-013              | T007, T008, T009, T010, T011                   |
| SC-001              | T001, T002, T003, T004, T005, T006, T011       |
| SC-002              | T004, T005, T006, T011                         |
| SC-003              | T001, T002, T003, T011                         |
| SC-004              | T004, T005, T006, T007, T008, T009, T011       |
| SC-005              | T001, T002, T003, T004, T005, T006, T011       |
| SC-006              | T004, T005, T006, T007, T008, T009, T011       |

Группы покрывают реальное поведение; завершающие задачи отвечают за acceptance/review/свидетельства проверок, не заменяют бизнес assertions. FR-011 для 024 включает ручные настройки; FR-013 для 022 запрет Settings/ClearQueue проверяется журнал вызовов fake provider.025/019selection/history контракт используется, не переопределяется.

## Completion

`verification.md` создаётся после авторизованного кода с истинными Passed/Failed/Blocked/NotRun, командами/датой/Red причинами,Green/Refactor итогом, предкоммитным review, ограничениями и следующим шагом. Tests остаются в repo. Предложение названия коммита:`Add single-instance notification receiver and processed ACK lifecycle`. Git — только по GIT_POLICY; agent не commit/stage/reset.

## Operator-only actions

- Настройки: webhookUrl пустой, incomingWebhook включён; дополнительно исходящие toggles024 для status acceptance. Агент не меняет настройки.
- Две вкладки одного instance: second limited/send denied; explicit retry после release/drain. Один constant Node process, никакого horizontal scaling.
- На fake provider разорвать stream до ACK: нет Delete; после ACK возможна потеря удалённого события при reload, полнота не обещается.

Отдельная авторизация кода впереди; этот tasks документ не разрешает real Receive/Delete/Send/settings или implementation. Frozen analyze отдельным проходом после финализации docs.
