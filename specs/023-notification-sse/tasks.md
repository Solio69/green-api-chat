# Tasks: SSE доставка и Query обработка

**Input**:[spec](spec.md),[plan](plan.md),research/data-model/contracts/quickstart.
**Spec Approved**:2026-10-02. **Implementation**: CodeNotAuthorized; все задачи NotRun.
Пути относительны корню проекта. Работа строго последовательно, без параллельных source изменений.

## Проверяемые этапы

- [ ] T001 [US1] HTTP и transport: Red. Написать постоянные тесты в `tests/integration/notification-api.spec.ts, tests/integration/notification-stream.spec.ts`: cookie/scope/capability guards, matching/missing/null/invalid/foreign Origin:403invalid_request доbody/lease/provider; GETscope+cap/noCORS; body/no-secret URLs, SSE headers/frame/expiry/abort/generation, ownerbusy без takeover. Запустить `npm run test:integration -- tests/integration/notification-api.spec.ts tests/integration/notification-stream.spec.ts`, подтвердить поведенческое падение, а не missing import/окружение. Минимальный нейтральный typechecked seam при новом module допустим лишь для запуска контракта; бизнес-поведение до Red не внедрять. Зависимость: нет, соответствующие feature prerequisites из plan.
- [ ] T002 [US1] HTTP и transport: Green. После подтверждения предшествующего Red реализовать `src/lib/notifications/handle-notification-request.ts, create-notification-stream.ts и четыре notification routes` и необходимые types/constants из plan. Точная обязанность: cookie/scope/capability guards, matching/missing/null/invalid/foreign Origin:403invalid_request доbody/lease/provider; GETscope+cap/noCORS; body/no-secret URLs, SSE headers/frame/expiry/abort/generation, ownerbusy без takeover. Запустить ту же команду, получить Green; реальные provider calls исключить. Зависимость: T001.
- [ ] T003 [US1] HTTP и transport: Refactor. Сохранить и упростить реализацию/fixtures предыдущей группы, не ослаблять assertions; повторить `npm run test:integration -- tests/integration/notification-api.spec.ts tests/integration/notification-stream.spec.ts` + `npm run typecheck`. Pure refactor основывается на подтверждённом Green. Зависимость: T002.
- [ ] T004 [US1] Controller/ACK/reconnect: Red. Написать постоянные тесты в `tests/integration/notification-client.spec.ts`: UTF8/chunks/CRLF/oversized frame,30 сек stall, backoff/grace, noACK badapply, replay ACK, authclose и ownership409 не logout, Scope close abort/generation. Запустить `npm run test:integration -- tests/integration/notification-client.spec.ts`, подтвердить поведенческое падение, а не missing import/окружение. Минимальный нейтральный typechecked seam при новом module допустим лишь для запуска контракта; бизнес-поведение до Red не внедрять. Зависимость: T003.
- [ ] T005 [US1] Controller/ACK/reconnect: Green. После подтверждения предшествующего Red реализовать `src/lib/notifications/parse-sse.ts, create-notification-connection.ts` и необходимые types/constants из plan. Точная обязанность: UTF8/chunks/CRLF/oversized frame,30 сек stall, backoff/grace, noACK badapply, replay ACK, authclose и ownership409 не logout, Scope close abort/generation. Запустить ту же команду, получить Green; реальные provider calls исключить. Зависимость: T004.
- [ ] T006 [US1] Controller/ACK/reconnect: Refactor. Сохранить и упростить реализацию/fixtures предыдущей группы, не ослаблять assertions; повторить `npm run test:integration -- tests/integration/notification-client.spec.ts` + `npm run typecheck`. Pure refactor основывается на подтверждённом Green. Зависимость: T005.
- [ ] T007 [US2] Cache/overlay и workspace integration: Red. Написать постоянные тесты в `tests/query/notification-sse.spec.ts`; test-only harness: `tests/fixtures/query-app/lib/notification-fixture.ts`, `tests/fixtures/query-app/app/api/notifications/[action]/route.ts`, `tests/fixtures/query-app/app/api/notification-fixture/route.ts`, `tests/fixtures/query-app/components/NotificationProbe/NotificationProbe.tsx`: A при selected B без switch, history/SSE/accepted permutations без duplicates/regression, early status без пузыря, unknown chat preserve/error/absence/merge, ACK до GetChats, captureOwnerContext/isCurrentOwnerContext retainedgrace10sec acceptedpublication/canSendfalse, epochrevoke/timeoutfalse; recoveryconsumer018 currenttarget/refetch count10/coalescing/null/stalescope; StrictMode один controller и recoverycount 10. Запустить `npm run test:query -- tests/query/notification-sse.spec.ts`, подтвердить поведенческое падение, а не missing import/окружение. Минимальный нейтральный typechecked seam при новом module допустим лишь для запуска контракта; бизнес-поведение до Red не внедрять. Зависимость: T006.
- [ ] T008 [US2] Cache/overlay и workspace integration: Green. После подтверждения предшествующего Red реализовать `src/lib/notifications/apply-notification.ts, refresh-notification-chats.ts, src/components/NotificationProvider/NotificationProvider.tsx, src/app/page.tsx, src/components/LogoutButton/LogoutButton.tsx, src/components/ChatHistoryPanel/ChatHistoryPanel.tsx` и необходимые types/constants из plan. Точная обязанность: A при selected B без switch, history/SSE/accepted permutations без duplicates/regression, early status без пузыря, unknown chat preserve/error/absence/merge, ACK до GetChats, captureOwnerContext/isCurrentOwnerContext retainedgrace10sec acceptedpublication/canSendfalse, epochrevoke/timeoutfalse; recoveryconsumer018 currenttarget/refetch count10/coalescing/null/stalescope; StrictMode один controller и recoverycount 10. Запустить ту же команду, получить Green; реальные provider calls исключить. Зависимость: T007.
- [ ] T009 [US2] Cache/overlay и workspace integration: Refactor. Сохранить и упростить реализацию/fixtures предыдущей группы, не ослаблять assertions; повторить `npm run test:query -- tests/query/notification-sse.spec.ts` + `npm run typecheck`. Pure refactor основывается на подтверждённом Green. Зависимость: T008.
- [ ] T010 Операторские условия и завершение acceptance: документировать проверенные settings/runtime предусловия в `specs/023-notification-sse/verification.md`; выполнить ручные fake сценарии quickstart/checklists, не менять remote настройки. Зависимость:T009. Основание: FR-010/011.
- [ ] T011 Сверить весь diff со spec и coverage, выполнить подходящий integration/query набор +typecheck/lint/format/build из plan; провести предкоммитное ревью и записать actual commands/results/Red/Green/risks в `specs/023-notification-sse/verification.md`. Обновить tasks/acceptance только по evidence; Gitmutations не выполнять. Зависимость:T010. Это завершение всех FR/SC, не новое product behavior.

## Dependencies & Execution Order

T001→T002→T003→T004→T005→T006→T007→T008→T009→T010→T011. Каждая Green ждёт фактического behavioral Red, каждый refactor — Green. Все source paths/constants/tests из plan входят в ближайшую соответствующую Green группу; новые types сами по себе недостаточное доказательство Red. 022 runtime/normalizer/owner approved и реализованный к моменту backend integration;018 Query public session/cleanup/error contract;019 shared message cache/session chat overlay;019 pure reducer/issue helpers по правилам spec024;025 selection recovery subscription. Wrapper держит SSR slots,021 sender uses internal scoped owner headers. Shared source files меняются последовательными feature steps, parallel docs не разрешают parallel editing этих файлов.

Baseline ранее реализованных dependencies подтвердить перед изменением общего helper; не запускать тесты всего repo после каждого строчного исправления. Runtime tests не запускаются сейчас. Browser fixture изменений статуса — только observability, никакой редизайн.

## Coverage

| Требование/критерий | Задачи                                                           |
| ------------------- | ---------------------------------------------------------------- |
| FR-001              | T001, T002, T003, T004, T005, T006, T010, T011                   |
| FR-002              | T001, T002, T003, T004, T005, T006, T010, T011                   |
| FR-003              | T001, T002, T003, T007, T008, T009, T010, T011                   |
| FR-004              | T007, T008, T009, T010, T011                                     |
| FR-005              | T007, T008, T009, T010, T011                                     |
| FR-006              | T007, T008, T009, T010, T011                                     |
| FR-007              | T004, T005, T006, T007, T008, T009, T010, T011                   |
| FR-008              | T001, T002, T003, T004, T005, T006, T007, T008, T009, T010, T011 |
| FR-009              | T001, T002, T003, T004, T005, T006, T010, T011                   |
| FR-010              | T001, T002, T003, T004, T005, T006, T010, T011                   |
| FR-011              | T007, T008, T009, T010, T011                                     |
| FR-012              | T001, T002, T003, T004, T005, T006, T007, T008, T009, T010, T011 |
| FR-013              | T007, T008, T009, T010, T011                                     |
| SC-001              | T007, T008, T009, T011                                           |
| SC-002              | T007, T008, T009, T011                                           |
| SC-003              | T001, T002, T003, T004, T005, T006, T011                         |
| SC-004              | T001, T002, T003, T004, T005, T006, T011                         |
| SC-005              | T001, T002, T003, T004, T005, T006, T007, T008, T009, T011       |
| SC-006              | T007, T008, T009, T011                                           |

Группы покрывают реальное поведение; завершающие задачи отвечают за acceptance/review/свидетельства проверок, не заменяют бизнес assertions. FR-011 для 024 включает ручные настройки; FR-013 для 022 запрет Settings/ClearQueue проверяется журнал вызовов fake provider.025/019selection/history контракт используется, не переопределяется.

## Completion

`verification.md` создаётся после авторизованного кода с истинными Passed/Failed/Blocked/NotRun, командами/датой/Red причинами,Green/Refactor итогом, предкоммитным review, ограничениями и следующим шагом. Tests остаются в repo. Предложение названия коммита:`Connect scoped SSE notifications to shared chat query facts`. Git — только по GIT_POLICY; agent не commit/stage/reset.

## Operator-only actions

- Под fake provider выбрать B, доставить A: B не переключается, unknownA сразу display actual label/chatId; GetChats error не удаляет row/message.
- Отключить stream и вернуть: canSend=false→reconnect, history count 10 выбранногочата, нет обещания полного replay. Вторая вкладка explicit limited и серверный Send deny.
- Один Node process; при proxy отключить buffering. Реальный прием/удаление запускается только после отдельной code/run авторизации.

Отдельная авторизация кода впереди; этот tasks документ не разрешает real Receive/Delete/Send/settings или implementation. Frozen analyze отдельным проходом после финализации docs.
