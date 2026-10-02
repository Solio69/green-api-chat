# Tasks: история выбранного чата и кеш

**User Approval**: 2026-10-02. **Code Authorization**: разрешено пользователем 2026-10-02; отображение строго по макету.
**Результат реализации**: реализация PassedSynthetic; совместная T011 завершена после 023/021/024. Доказательства: [verification.md](verification.md). Задачи идут
последовательно, никакого параллельного кода.

## Dependencies

Сначала 025/018, полный read-only analyze и отдельное разрешение. Установленные
инструменты используются без npm install/Git mutations. Общие foundation
helpers создаются 019 ДО 023/021/024; реальные producers/HTTP очереди 019 не
создаёт. SC-005 совместная интеграция выполняется после внешних steps, отдельно
от изолированных проверок общего ядра. Пути полностью перечислены в [plan](plan.md).

## US2 — Общая модель и совместимость producers

- [x] T001 Прочитать актуальные 018/025, общие контракты и git diff read-only; подтвердить завершённость предпосылок, авторизацию и отсутствие конфликта правок UI/staging. При изменившемся исходнике обновить документы отдельно до зависимого кода. Общий порядок 025 → 018 → 019 → 022 → 023 → 020 → 021 → 024.
- [x] T002 [US2] RED: добавить tests/integration/message-cache.spec.ts и fixtures tests/history/constants.ts: history/live/accepted всех порядков, одна identity/разный текст, одинаковый текст разных id, empty/error retention, monotonic positive, ранний fact без bubble, TTL 300000/overflow 1000/точные повторы, issue оба порядка/без id, active=false/clear, GC Infinity defaults до записи. Дополнить tests/query/history-window.spec.ts и существующий HistoryProbe из 018 сценарием failure→history delivered/read: свежий ответ сохраняет положительный статус и публикует общий issue; проверять самого потребителя Query без импорта ещё не созданных UI 019. Команды: npm run test:integration -- tests/integration/message-cache.spec.ts; npm run test:query -- tests/query/history-window.spec.ts. Подтвердить целевое падение; ошибка импорта или настройки не считается Red. FR-002–FR-003, FR-005, FR-007–FR-011; SC-003–SC-005 foundation.
- [x] T003 [US2] GREEN: расширить src/lib/messages/{types,constants,merge-message-facts,message-cache}.ts и создать use-conversation-messages.ts, message-status-issues.ts, use-message-issues.ts; зарегистрировать defaults для префиксов Query в create-query-session.ts. Синхронные неизменяемые apply/add возвращают issues; очистка ранних фактов ленивая, последние ошибки публикуются в своей области без bubble. Расширить src/lib/history/use-chat-history.ts: returned issues текущего guarded history merge сразу передавать в publishMessageIssues; сохранить принадлежность accessId/scope и отсутствие дополнительной сети. Реальные producers отсутствуют. Команда T002 до Green; зависимость: T002.
- [x] T004 [US2] REFACTOR: устранить дубли core/014, сохранить чистый reducer и внедряемые часы, безопасные string keys, active guards, Query policy; прогнать T002 и tests/integration/history-query.spec.ts, tests/integration/chat-query.spec.ts. Зависимость: T003.

## US2 — Session chats overlay

- [x] T005 [US2] RED: tests/integration/session-chat-facts.spec.ts, tests/query/session-chat-overlay.spec.ts; фикстуры accepted/incoming/profile/label, pending fact до подтверждения GetChats, empty/error refresh, подтверждение бездубля/потери label, close, gc и same name разный chatId. Команды: npm run test:integration -- tests/integration/session-chat-facts.spec.ts; npm run test:query -- tests/query/session-chat-overlay.spec.ts. Подтвердить поведенческий Red. FR-007, FR-011–FR-012; SC-003,SC-006; связь с contracts 021/023 без реальных HTTP.
- [x] T006 [US2] GREEN: src/lib/chats/session-chat-facts.ts/use-session-chat-labels.ts; расширить use-chats.ts derived union, create-query-session.ts successful GetChats reconcile; ChatList.tsx optional labelsByChatId, ChatListItem.tsx optional fallbackLabel и ChatListPanel.tsx hook integration. При error сохранять известный union рядом с прежним error card, без редизайна. Не выдавать label за profile, provider metadata приоритетны, политика stale/gc/refetch 014 сохранена. Команды T005 до Green; зависимость: T005.
- [x] T007 [US2] REFACTOR: зелёные проверки overlay и публичного PersonalChat[] и lifecycle 014, отсутствие второй копии данных в useState; прогнать T005 и существующие query tests 014/025 по актуальным filenames. Проверить совместимость selected target labels и очистку scope. Зависимость: T006.

## US1 — Читаемая история по макету

- [x] T008 [US1] RED: tests/query/history-window.spec.ts, tests/e2e/history-window.spec.ts; дополнить HistoryProbe.tsx и страницу фикстуры app/page.tsx. Проверки: existing/found target свежие десять сообщений, первичная загрузка и live до истории не объявляются успешным чтением, merged []+pending, ошибка с данными и без данных, media placeholder/no download, safe HTML literal/wrap/time/direction, count: 10 при более чем десяти известных сообщениях, A→B→A/back/close, scroll вверх без fetch. Команды: npm run test:query -- tests/query/history-window.spec.ts; npm run test:e2e -- tests/e2e/history-window.spec.ts. Подтвердить Red. FR-001–FR-006, FR-009–FR-012; SC-001–SC-004,SC-006.
- [x] T009 [US1] GREEN: ChatHistoryPanel/{ChatHistoryPanel.tsx,index.ts,constants.ts,ChatHistoryPanel.module.scss}, MessageList/{MessageList.tsx,index.ts,constants.ts,MessageList.module.scss}, MessageBubble/{MessageBubble.tsx,index.ts,constants.ts,MessageBubble.module.scss}; src/app/page.tsx conversation slot. Вынесенный read hook/018 useChatHistory, состояния/ручной повтор, existing макет, direction/text/time, optional status slot default: null. Не менять 025 Pane/Header или 021 composer. Команды T008 до Green; зависимость: T008.
- [x] T010 [US1] REFACTOR: проверить измерение scroll/позицию, отсутствие second network/cache и фальшивой пустоты, SCSS modules/code style. После серии правок повторить T008+018 query regression. Фикстура нижнего слота формы отправки показывает макет без утверждения отправки. Зависимость: T009.

## Integrated Acceptance and Finish

- [x] T011 [US2] После отдельной реализации 023/021/024 выполнить совместный SC-005: реальное входящее сообщение и ACK до позднего ответа истории, accepted HTTP после early read, повтор факта очереди без дубля, history delivered после read, contradictory/no-id issue без вымышленного bubble. Использовать целевые query/E2E фикстуры соответствующих задач и дополнить history-window tests только общей приёмкой. До prerequisites статус NotRunExternal, isolated T002 не заменяет integrated acceptance. FR-007–FR-008,FR-010; SC-005. Зависимости: T010 и внешние features.
- [x] T012 Выполнить итоговый подходящий набор quickstart: integration/query/E2E, typecheck/lint/styles, npm run format:check для исходников и тестов и отдельный Prettier check документации с --ignore-path NUL. Записать фактические результаты acceptance.md. T011 при внешней неготовности остаётся NotRunExternal, без ложного полного PASS 019. Зависимость: T010 (и T011 при готовой интеграции).
- [x] T013 Сверить все FR/SC и diff read-only предкоммитное ревью: no pagination/count: 20/DB/SSE/send/redesign/status indicators до 024. Проверить C1–C8, ownership и сохранённый staging. Зависимость: T012.
- [x] T014 Создать verification.md фактических Red/Green/итоговых команд, отмечать задачи только доказательствами; перечислить NotRunExternal и последующие dependencies. Предложить английский commit title `feat: render retained chat history with shared message cache`; Git не выполнять. Зависимость: T013.

## Traceability

| Требование | Задачи                                |
| ---------- | ------------------------------------- |
| FR-001     | T008–T010,T012                        |
| FR-002     | T002–T004,T008–T010,T012              |
| FR-003     | T002–T004,T008–T010,T012              |
| FR-004     | T008–T010,T012                        |
| FR-005     | T002–T004,T008–T010,T012              |
| FR-006     | T008–T010,T012–T013                   |
| FR-007     | T002–T007,T011–T012                   |
| FR-008     | T002–T004,T011–T012                   |
| FR-009     | T008–T010,T012                        |
| FR-010     | T002–T004,T008–T011,T013              |
| FR-011     | T002–T010,T012–T013                   |
| FR-012     | T005–T010,T012–T013                   |
| SC-001     | T008–T010,T012                        |
| SC-002     | T008–T010,T012                        |
| SC-003     | T002–T010,T012                        |
| SC-004     | T002–T004,T008–T010,T012              |
| SC-005     | T002–T004 foundation, T011 integrated |
| SC-006     | T005–T010,T012–T013                   |

T001 и T013–T014 — обязательный процесс актуальности/завершения C7. Tasks/plan
не являются Code Authorization. Итоговый полный analyze выполняется координатором после
заморозки документов; фактические Red/Green и итоговые проверки записаны в verification.md. T011 остаётся внешней совместной приёмкой.

## Совместная приёмка 2026-10-02

T011 / SC-005: PassedSynthetic. Реальные React/SSE/ACK сценарии в
[тесте формы](../../tests/query/message-composer.spec.ts): входящее применяется
и подтверждается до поздней истории; early read до HTTP acceptance не создаёт
пустой пузырь и прикрепляется к точному id. Полная регрессия: 342 integration,
30 Query; production E2E в комплекте 020–024. Старые упоминания NotRunExternal
в инструкциях описывают условие выполнения этапа до готовности dependencies;
текущее состояние определяет этот раздел и [verification](verification.md).

## Приёмка ограниченной высоты

- [x] T015 По прямой просьбе пользователя 2026-10-03 исправить рост переписки от сообщений: сначала tests/e2e/history-scroll.spec.ts показывает увеличение высоты 648 → 3142; затем ограничить каркас и grid/flex цепочку, сохранить шапку и форму, обеспечить внутренний scroll и initial/follow bottom. Проверить пять ширин и высоты 800/480, ручную прокрутку, сохранение anchor через Query, макет, линтеры, типы; обновить verification и выполнить отдельный read-only analyze. FR-004, FR-006, FR-012 / SC-002, SC-006 / UI-016. Зависимость: T010/T011/T012.
