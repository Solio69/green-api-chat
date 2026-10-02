# Analysis: SSE и применение Query фактов

**Дата**: 2026-10-02. **Этап**: техническая подготовка после согласования spec, до разрешения реализации.
**Итог**: Passed — существенных разногласий spec/plan/tasks/contracts не найдено. CodeNotAuthorized.

Источники: [spec](spec.md), [plan](plan.md), [tasks](tasks.md), [research](research.md), [data-model](data-model.md), [quickstart](quickstart.md), [readiness](checklists/requirements.md), [acceptance](checklists/acceptance.md), [общий контракт](../../docs/messaging-specs.md).

## Границы и метод

Exact prerequisites -RequireTasks -IncludeTasks Passed из корня проекта; FEATURE_DIR подтверждён 023-notification-sse. Прочитаны spec/plan/tasks/research/data-model/contracts/quickstart/checklists и связанные 018/019/020/021/025/общие контракты, локальные AGENTS/Git/constitution/skills. Проверены согласованность, содержание FR/SC→tasks, TDD, paths/dependencies, безопасность owner/ACK и практические границы recovery. Runtime/browser/provider поведение не запускалось.

Полный inventory держался в памяти до и после, count 470, SHA-256 digest 36B394D9A26A47E7AE2F783E485801B96DC7A8A03806A17C012FB14264BFB405. Списки и каждый file hash совпали; snapshot включает код, конфигурацию, документы, skills и scripts. Исключены .git, node_modules, .next, playwright-report, test-results, coverage, out, build, tsconfig.tsbuildinfo. Это не подтверждение неизменности excluded dependencies/generated files. Во время прохода ничего в project не записывалось; analysis.md сохраняется отдельным действием после окончания общего замороженного прохода.

## Findings

Открытых findings нет: CRITICAL: 0 / HIGH: 0 / MEDIUM: 0 / LOW: 0. Повторение одинаковых shared guards в contracts является явной ссылочной интеграцией, не альтернативной политикой. Продуктовые вопросы закрыты, технические контракты синхронизированы. Provider/source/операторские ограничения перечислены ниже и не выдаются за подтверждённые живым тестом.

## Содержательное покрытие

T001–T003: cookie/scope/capability/Origin guard, Node SSE headers/encoding/abort/expiry/generation. T004–T006: bounded chunk-safe UTF8/SSE parser, stall/reconnect/grace и serializedACK, applyfailure noACK, closed scope rejection. T007–T009: Querymerge history/live/accepted, без дублей и понижения read, unknown personal chat overlay сохранён при отсутствии в GetChats или ошибке, ACK не ждёт GetChats, внутреннее доказательство active owner и потребитель восстановления 018, текущий target/count 10. T010–T011: fake manualacceptance, предусловия запуска и verification.

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

Группы покрывают реальное поведение; завершающие задачи отвечают за acceptance/review/свидетельства проверок, не заменяют бизнес assertions. FR-011 для 024 включает ручные настройки; FR-013 для 022 запрет Settings/ClearQueue проверяется журналом вызовов fake provider. Контракт выбора 025 и истории 019 используется, не переопределяется.

Количественное и содержательное покрытие: 13/13 FR, 6/6 SC (100%). Завершающие T010/T011 не заменяют поведенческие проверки в целевых группах. Tasks без требований: 0; операторская приёмка и review обоснованы FR/SC/C7.

## TDD и зависимости

Повторная сверка общего контракта 019 подтверждает: после guarded merge текущего ответа `use-chat-history.ts` синхронно вызывает `publishMessageIssues` с возвращёнными ошибками; 018 не зависит от ещё не созданного helper 019. Отказ с последующим accepted/null не теряется и не считается доставленным, а success/failure в любом порядке сохраняет достоверный delivered/read и общую ошибку. Late scope/accessId не публикует ошибку нового подключения. Эта основа согласована с 023/021 и отображением 024.

Три последовательные Red/Green/Refactor группы с точными integration/query file filters. Новое workspace/controller/ownership поведение имеет собственный behavioral Red; существующий Query session ресурсный API 018 используется единожды. Проверки захваченных scope/epoch и одна controller при StrictMode assertions определены. Browser fixture routes/state/probe объявлены в manifest, не выполняют реальные вызовы провайдера.

Общий порядок: 025→018→019→022→023→020→021→024. MessageDTO/MessageStatusFact/nullableChatIssueFact и applyMessageFacts/addAcceptedMessage/publishMessageIssues общие. Scope ≠ очередь инстанса; новые исходники до реализации ожидаемы. Существующие общие модули меняются последовательно в соответствующей feature, без параллельных правок кода.

## C1–C8

| Принцип | Результат анализа | Основание                                                                               |
| ------- | ----------------- | --------------------------------------------------------------------------------------- |
| C1      | PASS              | Согласованные продуктовые решения сохранены, нет новых скрытых пользовательских политик |
| C2      | PASS              | Отдельная feature и последовательные tasks, порядок реализации согласован               |
| C3      | PASS              | Spec Approved 2026-10-02; CodeNotAuthorized, анализ не разрешает код                    |
| C4      | PASS              | Git mutations отсутствуют; staging не изменялся                                         |
| C5      | PASS              | Пакеты/ПО/provider settings/DB не изменялись; действия пользователя отделены            |
| C6      | PASS              | Явные FeatureDirectory и изоляция scope/owner; вымышленные fixtures                     |
| C7      | PASS              | Анализ read-only и подтверждён полным snapshot; TDD планируется, acceptance — NotRun    |
| C8      | PASS              | Существующие инструменты, один Node, ограниченная память, без DB/broker/редизайна       |

## Метрики

| Метрика                                      | Значение |
| -------------------------------------------- | -------- |
| Исходный комплект Markdown (без analysis.md) | 11       |
| User stories                                 | 2        |
| FR / SC                                      | 13 / 6   |
| Последовательные T-ID                        | 11       |
| Непокрытые FR/SC                             | 0        |
| Существенные неоднозначности / противоречия  | 0 / 0    |
| Поведенческие дубли с различными правилами   | 0        |
| Runtime / тесты / операторская приёмка       | NotRun   |

## Ограничения и действия пользователя

FetchSSE выбран вместо native EventSource ради scope/owner headers, secrets не в URL/storage. OwnerContext закрыт в controller/слое отправки, новый Send требует canSend, поздний accepted при сохранённом grace требует доказательства того же owner; revoke/timeout/close отвергают. Потребитель восстановления находится в ChatHistoryController 018 внутри SelectionProvider, 025 не импортирует будущую 023. History count 10 и остаток очереди не дают полного replay; один Node и отключение proxy buffering обязательны. Ядро 019 сохраняет ошибки раньше подключения отображения 024; частичный шаг 023 не заявляет полностью готовое отображение.

Пользователь вручную проверяет настройки: webhookUrl пустой, incomingWebhook=yes; для фактических delivered/read outgoingMessageWebhook/outgoingAPIMessageWebhook/outgoingWebhook=yes. Агент ничего не устанавливал, не менял настройки провайдера и не выполнял реальные Receive/Delete/Send. Работа одного постоянного процесса Node и stream proxy без buffering требуют операторской проверки перед запуском.

## Проверки и следующий этап

Passed: prerequisites, локальное покрытие и относительные ссылки, сравнение полного before/after inventory/hash, read-only сверка контрактов. Форматирование документов предыдущего этапа через Prettier --ignore-path NUL Passed; оно не является проверкой поведения приложения.
NotRun: behavioral Red/Green/Refactor, integration/query/e2e/build реализованного кода, real provider/settings/proxy/фактический discriminator входящего события. Verification.md не создаётся с фиктивными Passed; его задача предусмотрена после кода.

Выполнять 023 после реализации 022/018/019/025 и отдельного разрешения. Полные accepted/перестановки Send→SSE дополняются в 020/021 и видимые случаи ошибок/статусов — в 024.

Предложенное название коммита: `Connect scoped SSE notifications to shared chat query facts`. Агент не выполняет Git mutations. Analysis не разрешает реализацию.
