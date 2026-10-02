# Tasks: Статусы доставлено/прочитано/отказ

**Input**:[spec](spec.md),[plan](plan.md),research/data-model/contracts/quickstart.
**Spec Approved**:2026-10-02. **Implementation**: CodeNotAuthorized; все задачи NotRun.
Пути относительны корню проекта. Работа строго последовательно, без параллельных source изменений.

## Проверяемые этапы

- [ ] T001 [US1] Provider status normalization: Baseline и новые assertions. Написать постоянные тесты в `tests/integration/message-statuses.spec.ts`: delivered/read/failed/noAccount, missing id допустимый failure, unknown enum ignored, corruptknown status malformed, scope/chat/stringid/noAccount privacy/no raw description. Запустить `npm run test:integration -- tests/integration/message-statuses.spec.ts`, Подтвердить existing Green; если новая assertion обнаружила недостающее поведение, зафиксировать её поведенческий Red, а не missing import/окружение. Эти core modules к моменту выполнения 024 уже реализованы 022/019; сначала подтвердить baseline. Ошибки окружения не являются Red, уже пройденный целевой test не надо искусственно ломать. Зависимость: нет, соответствующие feature prerequisites из plan.
- [ ] T002 [US1] Provider status normalization: исправление после нового Red либо сохранение baseline Green. Подтвердить baseline существующего 022 normalizer; если новая assertion выявила недостаток поведения, после её Red точечно исправить `src/lib/notifications/normalize-message-status.ts`. Если baseline уже Green, выполнить чистый рефакторинг без выдуманного Red. Точная обязанность: delivered/read/failed/noAccount, missing id допустимый failure, unknown enum ignored, corruptknown status malformed, scope/chat/stringid/noAccount privacy/no raw description. Запустить ту же команду, получить Green; реальные provider calls исключить. Зависимость: T001.
- [ ] T003 [US1] Provider status normalization: Refactor. Сохранить и упростить реализацию/fixtures предыдущей группы, не ослаблять assertions; повторить `npm run test:integration -- tests/integration/message-statuses.spec.ts` + `npm run typecheck`. Pure refactor основывается на подтверждённом Green. Зависимость: T002.
- [ ] T004 [US1] Merge/early facts/conflicts: Baseline и новые assertions. Написать постоянные тесты в `tests/integration/message-statuses.spec.ts`: read→delivered→acceptance→history, success/failure в обоих порядках и conflict, early fact до текста, без bubble, затем apply, TTL 5 мин/max 1000/oldest/prune/scope close, no incoming status/no auto Send. Запустить `npm run test:integration -- tests/integration/message-statuses.spec.ts`, Подтвердить existing Green; если новая assertion обнаружила недостающее поведение, зафиксировать её поведенческий Red, а не missing import/окружение. Эти core modules к моменту выполнения 024 уже реализованы 022/019; сначала подтвердить baseline. Ошибки окружения не являются Red, уже пройденный целевой test не надо искусственно ломать. Зависимость: T003.
- [ ] T005 [US1] Merge/early facts/conflicts: исправление после нового Red либо сохранение baseline Green. Подтвердить baseline018/019 reducer/cache/issues; если расширенная assertion выявила недостаток, после её behavioral Red точечно исправить `src/lib/messages/merge-message-facts.ts`, `src/lib/messages/message-status-issues.ts`, `src/lib/messages/message-cache.ts`. Уже зелёные permutations не объявлять новым Red; сохранять покрытие. Точная обязанность: read→delivered→acceptance→history, success/failure в обоих порядках и conflict, early fact до текста, без bubble, затем apply, TTL 5 мин/max 1000/oldest/prune/scope close, no incoming status/no auto Send. Запустить ту же команду, получить Green; реальные provider calls исключить. Зависимость: T004.
- [ ] T006 [US1] Merge/early facts/conflicts: Refactor. Сохранить и упростить реализацию/fixtures предыдущей группы, не ослаблять assertions; повторить `npm run test:integration -- tests/integration/message-statuses.spec.ts` + `npm run typecheck`. Pure refactor основывается на подтверждённом Green. Зависимость: T005.
- [ ] T007 [US2] Observable integration: Red. Написать постоянные тесты в `tests/query/message-statuses.spec.ts`: labels accepted/delivered/read/failure, general chat/connection issue без fake bubble, invalid noACK/valid ignored ACK, disconnect не failed всех messages. Запустить `npm run test:query -- tests/query/message-statuses.spec.ts`, подтвердить падение по отсутствию новой видимой status/error интеграции. Это новый behavior, обязательный Red→Green; baseline core модулей уже подтверждён T001–T006 и не заменяет этот Red. Ошибка окружения/import не является Red. Зависимость:T006.
- [ ] T008 [US2] Observable integration: Green. После подтверждения предшествующего Red реализовать `src/lib/notifications/apply-notification.ts, normalize-notification.ts, src/components/MessageBubble/MessageBubble.tsx, src/components/ChatHistoryPanel/ChatHistoryPanel.tsx, src/components/MessageList/MessageList.tsx`, `src/components/MessageStatusIndicator/MessageStatusIndicator.tsx`, `src/components/MessageStatusIssue/MessageStatusIssue.tsx` и необходимые types/constants из plan. Точная обязанность: labels accepted/delivered/read/failure, general chat/connection issue без fake bubble, invalid noACK/valid ignored ACK, disconnect не failed всех messages. Запустить ту же команду, получить Green; реальные provider calls исключить. Зависимость: T007.
- [ ] T009 [US2] Observable integration: Refactor. Сохранить и упростить реализацию/fixtures предыдущей группы, не ослаблять assertions; повторить `npm run test:query -- tests/query/message-statuses.spec.ts` + `npm run typecheck`. Pure refactor основывается на подтверждённом Green. Зависимость: T008.
- [ ] T010 Операторские условия и завершение acceptance: документировать проверенные settings/runtime предусловия в `specs/024-message-statuses/verification.md`; выполнить ручные fake сценарии quickstart/checklists, не менять remote настройки. Зависимость:T009. Основание: FR-011.
- [ ] T011 Сверить весь diff со spec и coverage, выполнить подходящий integration/query набор +typecheck/lint/format/build из plan; провести предкоммитное ревью и записать actual commands/results/Red/Green/risks в `specs/024-message-statuses/verification.md`. Обновить tasks/acceptance только по evidence; Gitmutations не выполнять. Зависимость:T010. Это завершение всех FR/SC, не новое product behavior.

## Dependencies & Execution Order

T001→T002→T003→T004→T005→T006→T007→T008→T009→T010→T011. T001/T004 проверяют ранее реализованный core baseline; исправления зависят от реального нового Red, чистый refactor — от baseline Green. Для новой observable integration T007→T008→T009 обязательны behavioral Red→Green→Refactor. Все source paths/constants/tests из plan входят в ближайшую соответствующую Green группу; новые types сами по себе недостаточное доказательство Red. 019 normalized model/cache/early facts source of truth;022 validates envelope,022 validates status по spec024,023 consumes safe DTO,020/021 acceptance separate. MessageBubble/ChatHistoryPanel созданы 019;024 использует их status/error slots, сохраняет макет/styles, не создаёт новую страницу. Required toggles пользователь включает вручную.

Baseline ранее реализованных dependencies подтвердить перед изменением общего helper; не запускать тесты всего repo после каждого строчного исправления. Runtime tests не запускаются сейчас. Browser fixture изменений статуса — только observability, никакой редизайн.

## Coverage

| Требование/критерий | Задачи                                                           |
| ------------------- | ---------------------------------------------------------------- |
| FR-001              | T001, T002, T003, T007, T008, T009, T010, T011                   |
| FR-002              | T001, T002, T003, T010, T011                                     |
| FR-003              | T001, T002, T003, T004, T005, T006, T010, T011                   |
| FR-004              | T004, T005, T006, T010, T011                                     |
| FR-005              | T001, T002, T003, T007, T008, T009, T010, T011                   |
| FR-006              | T001, T002, T003, T004, T005, T006, T007, T008, T009, T010, T011 |
| FR-007              | T004, T005, T006, T007, T008, T009, T010, T011                   |
| FR-008              | T004, T005, T006, T007, T008, T009, T010, T011                   |
| FR-009              | T001, T002, T003, T007, T008, T009, T010, T011                   |
| FR-010              | T007, T008, T009, T010, T011                                     |
| FR-011              | T001, T002, T003, T007, T008, T009, T010, T011                   |
| FR-012              | T004, T005, T006, T007, T008, T009, T010, T011                   |
| FR-013              | T004, T005, T006, T007, T008, T009, T010, T011                   |
| SC-001              | T001, T002, T003, T004, T005, T006, T007, T008, T009, T011       |
| SC-002              | T004, T005, T006, T011                                           |
| SC-003              | T001, T002, T003, T004, T005, T006, T007, T008, T009, T011       |
| SC-004              | T001, T002, T003, T004, T005, T006, T007, T008, T009, T011       |
| SC-005              | T001, T002, T003, T004, T005, T006, T007, T008, T009, T011       |

Группы покрывают реальное поведение; завершающие задачи отвечают за acceptance/review/свидетельства проверок, не заменяют бизнес assertions. FR-011 для 024 включает ручные настройки; FR-013 для 022 запрет Settings/ClearQueue проверяется журнал вызовов fake provider.025/019selection/history контракт используется, не переопределяется.

## Completion

`verification.md` создаётся после авторизованного кода с истинными Passed/Failed/Blocked/NotRun, командами/датой/Red причинами,Green/Refactor итогом, предкоммитным review, ограничениями и следующим шагом. Tests остаются в repo. Предложение названия коммита:`Apply confirmed message delivery statuses without identity guesses`. Git — только по GIT_POLICY; agent не commit/stage/reset.

## Operator-only actions

- Пользователь проверяет outgoingMessageWebhook, outgoingAPIMessageWebhook, outgoingWebhook включены, webhookUrl пустой. IncomingWebhook требуется 022. Агент не вызывает SetSettings.
- На fake provider показать HTTP accepted отдельно от delivered/read; failure без id даёт общую ошибку без изменения случайной bubble; noAccount не утверждает отсутствие аккаунта.
- Рестарт/TTLearlyfact может потерять неподтверждённый текстом статус; history count 10 не является полным журналом.

Отдельная авторизация кода впереди; этот tasks документ не разрешает real Receive/Delete/Send/settings или implementation. Frozen analyze отдельным проходом после финализации docs.
