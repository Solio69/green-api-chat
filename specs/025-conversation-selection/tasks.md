# Tasks: выбор и открытие переписки

**Input**: [spec.md](spec.md), [plan.md](plan.md).
**Спека согласована**: 2026-10-02. **Код**: Authorized 2026-10-02 только для 025; собственные проверки Passed. Ревью пользователя ожидается.
Пути относительно корня; все задачи последовательны; результаты в verification.md.

## Подготовка

- [x] T001 Перечитать shared UI/staging и подтвердить исходное покрытие 014/015/016 командами quickstart регрессии; записать baseline в specs/025-conversation-selection/verification.md. Существующие пользовательские правки сохранить. Зависимость: разрешение кода, доступные 014/015/009/016.

## Модель выбора — US1/US2

- [x] T002 [US1/US2] Написать tests/integration/conversation-selection.spec.ts: A→A→B, повтор chatId, close/idempotence, мобильный возврат, resize и закрытие области подключения; подтвердить поведенческий Red командой npm run test:integration -- conversation-selection.spec.ts. Зависит от T001; отсутствующий import сначала обеспечить тестовым контрактным entrypoint, не выдавать его за Red.
- [x] T003 [US1/US2] Создать src/lib/conversations/types.ts и selection.ts, реализовать переходы data-model без сети/списка сообщений; получить Green T002. Зависит от подтверждённого Red T002.

## Context и существующие слоты

- [x] T004 [US1] Создать tests/fixtures/query-app/components/SelectionProbe/{SelectionProbe.tsx,index.ts}, подключить режим в tests/fixtures/query-app/app/page.tsx и tests/query/conversation-selection.spec.ts. Проверить единый выбор, found→open без поиска/SendMessage, StrictMode один клик, закрытие области подключения и отсутствие копии данных; подтвердить Red через npm run test:query -- conversation-selection.spec.ts. Зависит от T003.
- [x] T005 [US1] Создать ConversationSelectionProvider/{ConversationSelectionProvider.tsx,index.ts}; подключить ChatWorkspace.tsx, ChatListPanel.tsx, ChatList.tsx и RecipientSearchForm.tsx согласно contracts/conversation-selection.md; сохранить ReactNode слоты и Query 014. Получить Green T004. Зависит от подтверждённого Red T004.

## Навигация оболочки

- [x] T006 [US2] Написать tests/e2e/conversation-selection.spec.ts с реальными clicks/мобильный возврат/close/resize/focus/tab/поздние действия и фиктивным слотом истории; дополнить tests/constants.ts только фиктивными значениями. Подтвердить Red через npm run test:e2e -- conversation-selection.spec.ts. Зависит от T005; отсутствие API 019/021 не выдаётся за Red 025.
- [x] T007 [US2] Создать ConversationPane/{ConversationPane.tsx,ConversationPane.module.scss,index.ts} и ConversationHeader/{ConversationHeader.tsx,ConversationHeader.module.scss,constants.ts,index.ts}; точечно изменить ChatWorkspace.module.scss и ChatList.module.scss для существующих панелей/кнопок. Получить Green T006, сохранить tokens/breakpoint/макет. Зависит от подтверждённого Red T006.

## Интеграция и завершение

- [x] T008 [US1/US2] Проверить совместимость согласованных контрактов 018/019/021 через tests/query/conversation-selection.spec.ts и SelectionProbe: правильные chatId/accessId, children-слот различимых history-состояний, selectionEpoch при switch/close и сохранение при мобильном возврате. Реальная сеть и production composer здесь не реализуются; поздний фиктивный результат не вызывает openConversation. Зависит от T007 и готовых документов контрактов. Полные HTTP-сценарии проверяются в 019/021, здесь остаются NotRun до интеграции.
- [x] T009 [US1/US2] Refactor модели/композиции и accessibility: вынести действия/панели/селекторы и фикстуры в смысловые константы, кнопки шапки — в ConversationBackButton/ConversationCloseButton; строку списка с обработчиком, подписью и стилями — в ChatListItem; представление ошибки и кнопки повтора — в ChatListRecovery, сохранив запрос и состояние у ChatListPanel; два p подсказки поиска — в RecipientSearchHint с text/isHidden, сохранив hintId и стили; проверить аналогичные места по CODING_RULES и CODE_STYLE; вынести фокус в приватный useWorkspaceFocus с React capture handlers, refs, ResizeObserver и useEffectEvent; подтвердить шесть исходных сценариев и14 итоговых selection/workspace/history E2E, сохранить tests/e2e/chat-workspace.spec.ts; выполнить один итоговый набор quickstart (integration/query/E2E/typecheck/lint/styles/format). Зависит от T008; результаты относятся к собственной границе 025, не к ещё отсутствующим API 019/021.
- [x] T010 Сверить все FR/SC, ревью diff только чтением на отсутствие редизайна и чужого staging, сохранить specs/025-conversation-selection/verification.md (Red/Green/регрессия/ручные NotRun), обновить spec/tasks/checklists/acceptance только фактом. Зависит от T009; коммит не создавать.

## Dependencies & Execution Order

T001→T002(Red)→T003(Green)→T004(Red)→T005(Green)→T006(Red)→T007(Green)→
T008(contract compatibility)→T009(Refactor)→T010(report).
Тесты сохраняются. Разрешение кода получено отдельно в переписке. Пользователь также отдельно разрешил параллельную реализацию 018 субагентом; её код, TDD и отчёт принадлежат каталогу 018 и не расширяют задачи выбора 025.
025 не реализует историю; 018 предоставляет QuerySession lifecycle и контракт сети,
019 — слот истории, 021 — форму отправки. Порядок компонентной интеграции выбирается по общему
графу, не по возрастанию номера каталога.

## Coverage

| Требование/критерий | Задачи                                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| FR-001              | T002–T005,T008                                                                                                 |
| FR-002              | T004,T005                                                                                                      |
| FR-003              | T004,T005,T008                                                                                                 |
| FR-004              | T002–T005,T008                                                                                                 |
| FR-005              | T004,T006–T008                                                                                                 |
| FR-006              | T002,T006,T007                                                                                                 |
| FR-007              | T002,T006,T007                                                                                                 |
| FR-008              | T002,T004,T006,T007                                                                                            |
| FR-009              | T002,T006–T008                                                                                                 |
| FR-010              | T004,T006,T008                                                                                                 |
| SC-001              | T002,T004,T005,T008                                                                                            |
| SC-002              | T006,T007,T008: предоставленный history-слот и отсутствие выдуманной пустоты; реальная история проверяется 019 |
| SC-003              | T002,T006,T007                                                                                                 |
| SC-004              | T002,T006,T008: сигнал selectionEpoch; настоящий composer/late HTTP проверяются 021                            |
| SC-005              | T009,T010                                                                                                      |

T001 — baseline/C7; T009 — Refactor/C8; T010 — C3/C4/C7 ревью и отчёт — обязательное
завершение, не скрытые продуктовые требования.

## Completion

Результат 025 требует Passed целевых контрактных и браузерных проверок выбора и честного учёта ручных NotRun. Полный сценарий истории/отправки закрывается отдельными 019/021, а не объявляется проверенным в 025. verification фиксирует исходный baseline,
команды/причины Red, Green/Refactor, соответствие макету/спеке и ограничения.
Предложение имени коммита пользователю: feat: add conversation selection.
Операций Git агент не выполняет.

## Operator-only actions

Установок/миграций/изменения настроек провайдера нет. Пользователь отдельно разрешает
код выбранного шага после анализа; staging/commit остаются у пользователя.
