# Tasks: форма и отправка

**Input**: [spec.md](spec.md), [plan.md](plan.md). **Дата**: 2026-10-02.
**Статус**: NotStarted / CodeNotAuthorized. Spec согласована; реализация и
исполняемые тесты требуют отдельного разрешения. Пути относительно корня.

## Phase 1 — Клиентские границы TDD

- [ ] T001 [US1/US2/US3] После разрешения сверить свежий UI/diff, selection 025,
      owner 023, Send DTO 020, Message cache/overlay 019 и lifecycle 018; подготовить
      specs/021-message-composer/verification.md preflight. Не изменять server slots,
      staging или чужие незавершённые компоненты. Зависимость: разрешение после analysis.
- [ ] T002 [US1/US3] Написать tests/integration/message-send.spec.ts: original
      text/validation, client safe DTO, foreign scope/chat/attempt, unknown lostresponse,
      not_owner/busy ≠ session error, selectionEpoch/revision late guard. Missing
      module не Red: минимальный type-compatible каркас только после разрешения.
      Зависимость: T001.
- [ ] T003 [US1/US3] Запустить
      `npm run test:integration -- tests/integration/message-send.spec.ts`;
      подтвердить поведенческий Red, записать assertion и команду в verification.md.
      Зависимость: T002.
- [ ] T004 [US1/US3] После Red реализовать
      src/lib/sending/fetch-send-message.ts и editor-guards.ts, переиспользуя types,
      validator/constants 020 и SessionQueryError/handler 018; добавить client-only
      SendMessageError/AttemptResult в src/lib/sending/types.ts без изменения DTO;
      никаких retries/queues.
      Зависимость: T003 = подтверждённый Red.
- [ ] T005 [US1/US3] Повторить exact T003 команду, подтвердить Green постоянных
      tests/integration/message-send.spec.ts. Зависимость: T004.

## Phase 2 — Real React TDD

- [ ] T006 [US1/US2/US3] Создать tests/query/message-composer.spec.ts и реальный
      стенд tests/fixtures/query-app/components/MessageComposerProbe/{MessageComposerProbe.tsx,index.ts},
      tests/fixtures/query-app/app/sending/page.tsx. Проверять клавиатуру/IME, доступность,
      два потребителя и doubleclick, pending после close/switch, A→B→A/revision,
      StrictMode/unmount, accepted merge и firstchat/missing GetChats, unknown/history.
      Отдельно: grace disconnect с прежним proof/epoch разрешает accepted старой
      попытки при canSend:false, revoked/replaced owner не разрешает публикацию.
      Использовать exact captureOwnerContext/isCurrentOwnerContext023 API: новые sends
      запрещены при canSend:false, grace expiry/session close делают snapshot invalid;
      ownerEpoch — opaque string, proof не попадает в observable UIhook/pending/result.
      Стенд работает с fake transport/owner и настоящими Query/selection/cache;
      каркас production компонента допускается лишь для прохождения imports/render,
      не для подмены отсутствующего поведения. Зависимость: T005.
- [ ] T007 [US1/US2/US3] Запустить
      `npm run test:query -- tests/query/message-composer.spec.ts`;
      зафиксировать поведенческий Red, не build/fixture error. Зависимость: T006.
- [ ] T008 [US1/US2/US3] После Red реализовать
      src/components/MessageSendProvider/{MessageSendProvider.tsx,index.ts}:
      one useMutation retry:false/networkMode:always + synchronous latch,
      snapshot/session guard, addAcceptedMessage/rememberPersonalChat 019, no tempid;
      useNotificationOwner из NotificationProvider/index.ts даёт закрытый OwnerAccess;
      захватывать OwnerContext через captureOwnerContext 023 при canSend:true,
      late acceptance проверять isCurrentOwnerContext, без повторного live SSE gate;
      returned MessageApplyResult.issues обязательно передаются core019
      src/lib/messages/message-status-issues.ts publishMessageIssues без silent drop;
      last result принадлежит исходной попытке. Зависимость: T007.
- [ ] T009 [US1/US3] Реализовать
      src/components/MessageComposer/{MessageComposer.tsx,constants.ts,index.ts,
      MessageComposer.module.scss}: original text/current revision, pending field,
      Enter/Shift/IME, cleanup, history-first/manual warning. Только approved макет
      и существующие tokens; новая визуальная концепция не входит. Зависимость: T008.
- [ ] T010 [US1/US2/US3] Повторить exact T007 команду, получить Green всех real React
      сценариев и сохранить результаты в verification.md. Зависимость: T009.

## Phase 3 — Соединение в приложении TDD

- [ ] T011 [US1/US2/US3] Написать tests/e2e/message-composer.spec.ts: поиск →
      «Написать» → accepted/newlist, ошибочная первая отправка безсоздания, unknown
      → history action → manual warning, второй tab/block, navigation while pending.
      При необходимости минимально дополнить send-scenarios.json/fake-green-api.ts
      из 020, сохраняя все действующие fixture cases. Зависимость: T010 и реальные
      018/019/020/022/023/025; незавершённая цепочка = Blocked, не искусственный Red.
- [ ] T012 [US1/US2/US3] Запустить
      `npm run test:e2e -- tests/e2e/message-composer.spec.ts`;
      подтвердить поведенческий Red соединения и сохранить доказательство.
      Зависимость: T011.
- [ ] T013 [US1/US2/US3] После Red изменить только функциональные границы
      src/components/ChatWorkspace/ChatWorkspace.tsx (provider вне conditional pane)
      и src/components/ConversationPane/ConversationPane.tsx (composer slot),
      подключить MessageComposer; сохранить account/search/list/history/mobile и
      чужие стили. Зависимость: T012.
- [ ] T014 [US1/US2/US3] Повторить exact E2E T012, подтвердить Green; accepted
      facts сохраняются в исходном чате и новое поле не очищается старой попыткой.
      Зависимость: T013.

## Phase 4 — Refactor и завершение

- [ ] T015 [US1/US2/US3] Refactor только новых/затронутых functional файлов
      по CODING_RULES. После серии выполнить tests T003/T007/T012 и итоговую регрессию,
      typecheck/lint/styles/scoped format из quickstart; без повторов после мелких
      замечаний. Зависимость: T014.
- [ ] T016 [US1/US2/US3] Проверить keyboard/screenreader names/IME/mobile 320 и
      desktop1280/макет без редизайна; принять checklists/acceptance.md по фактическим
      результатам, не readiness checklist. При нехватке среды — Blocked с причиной.
      Зависимость: T015.
- [ ] T017 [US1/US2/US3] Read-only review diff/FR/SC/security; заполнить полный
      specs/021-message-composer/verification.md Red/Green/Refactor/commands/limitations,
      показать результат и следующий отдельно разрешаемый шаг. English commit title:
      `feat: connect message composer to confirmed sending`; Git mutations не выполнять.
      Зависимость: T016.

## Dependencies & Execution Order

T001 → T002 → T003 **Red** → T004 → T005 **Green** → T006 → T007 **React Red**
→ T008 → T009 → T010 **Green** → T011 → T012 **E2E Red** → T013 → T014 **Green**
→ T015 **Refactor** → T016 → T017. Параллельной реализации нет.
Критические accepted/cache/latch callbacks выполняются живым provider, не
одноразовыми callback unmount composer. Перед каждым implementation block
подтверждён именно поведенческий Red, не только существование тестового файла.

## Coverage

| Требование или критерий | Задачи                          |
| ----------------------- | ------------------------------- |
| FR-001                  | T002–T005, T011–T014            |
| FR-002                  | T006–T010, T011–T016            |
| FR-003                  | T006–T010, T011–T014            |
| FR-004                  | T006–T010, T011–T014            |
| FR-005                  | T002–T010, T011–T014            |
| FR-006                  | T006–T010, T011–T014            |
| FR-007                  | T006–T010, T011–T014            |
| FR-008                  | T002–T005, T006–T010, T011–T014 |
| FR-009                  | T002–T010, T011–T014            |
| FR-010                  | T006–T010, T011–T016            |
| FR-011                  | T006–T010, T011–T016            |
| FR-012                  | T002–T005, T006–T010, T011–T014 |
| FR-013                  | T002–T005, T006–T010, T011–T014 |
| SC-001                  | T003–T005, T007–T010, T012–T016 |
| SC-002                  | T003–T005, T007–T010, T012–T014 |
| SC-003                  | T007–T010, T012–T014            |
| SC-004                  | T007–T010, T012–T014            |
| SC-005                  | T003–T005, T007–T010, T012–T014 |
| SC-006                  | T007–T010, T012–T016            |
| SC-007                  | T003–T005, T007–T010, T012–T014 |

T001/T015–T017 обоснованы C6/C7/C8, соответствием макету, реальными проверками
и полным review/verification. До реализации Acceptance = NotRun.

## Completion

Все FR/SC имеют подтверждённые результаты, постоянные тесты и verification.md;
accepted/delivery разделены, unknown не создаёт повтор, новые принятые чаты
не теряются. Рабочий UI соответствует текущему макету, чужие изменения сохранены.
Наличие этого документа не заменяет полный analysis и разрешение кода.

## Operator-only actions

Новых пакетов/БД/миграций нет. Реальные SendMessage и настройка GREEN-API
выполняются пользователем; автоматические tests используют фиктивные значения.
Git — только чтение по GIT_POLICY.md; staging/commit/push здесь не разрешены.
