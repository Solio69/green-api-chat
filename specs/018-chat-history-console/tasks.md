# Tasks: история выбранного чата в консоль

**Spec approved**: 2026-10-02. **Code Authorization**: разрешена пользователем 2026-10-02 в текущем сообщении; повторное согласование не требуется.
**Implementation status**: Код, автоматическая регрессия, формат документов и предкоммитное ревью завершены;14/14 задач выполнены. Полный analysis сохраняется отдельным действием после стабильного read-only прохода.

## Prerequisites

Согласованные spec/plan, полный analyze после заморозки документов и отдельное
разрешение реализации. Для wiring требуется выполненная 025; изолированные
серверные проверки не требуют UI. Query 5.104.0 установлена
пользователем. Никаких npm install, Git mutations или реальных реквизитов.
Полный перечень файлов — [plan](plan.md); контракт модели расположен в 019,
но ядро создаёт 018, что не требует реализации UI 019.

## US1 — Fresh10 и безопасный сервер

- [x] T001 [US1] Прочитать актуальные 014/025 contracts и git diff read-only, подтвердить согласованные границы/shared файлы и отсутствие новых правок, требующих обновить plan; зависимости: разрешение и analyze. Не изменять staging.
- [x] T002 [US1] RED: добавить tests/history/constants.ts и tests/integration/history-api.spec.ts с исполнимыми no-op заглушками API/адаптера. tests/e2e/history-api.spec.ts, scenario tests/e2e/fixtures/history-scenarios.json и fake-green-api.ts проверяют actual route как регрессию/wiring после Red handler. Поведение: session/scope/body/methods, target-origin Host/protocol и NextRequest loopback regression; negativeOrigin (missing/null/invalid/foreign → 403 invalid_request без body/provider), count: 10, text/media, foreign chat, JSON/DTO, no-store, ошибки и ограниченный повтор 429/abort. Команда Red: npm run test:integration -- history-api.spec.ts history-query.spec.ts; E2E запускается в итоговом Green/regression наборе. Подтвердить падение целевого поведения, не окружения. FR-001–FR-003, FR-006, FR-009; SC-001–SC-002, SC-004–SC-005.
- [x] T003 [US1] GREEN: реализовать src/lib/chats/validate-chat-id.ts, src/lib/history/{types,constants,validate-history-request,normalize-history,handle-history-request}.ts, src/lib/green-api/get-chat-history.ts, src/app/api/chats/history/route.ts; расширить только нужные constants green-api/routes и создать src/lib/messages/types.ts. Выполнить команды T002 до Green; зависимость: подтверждённый T002. Нормализованный DTO личного чата и серверный count: 10 без медиа/секретов. В handle-history-request.ts Origin проверяется до body и provider по фактическому Host/protocol; malformed Host не включает fallback, как в контракте.
- [x] T004 [US1] REFACTOR: после Green убрать дубли и magic values T003, сохранить публичный 014 API и строгие guards; повторить T002 плюс существующий tests/integration/chats-api.spec.ts. Проверить ошибки по фактическому контракту 014, не автоматически удалять cookie на provider400/любой 409. Зависимость: T003.

## US2 — Изоляция Query, merge и lifecycle

- [x] T005 [US2] RED: tests/integration/history-query.spec.ts; существующий tests/integration/chat-query.spec.ts включить в итоговую регрессию без изменения поведения — fetch guards после JSON, normalized session errors, monotonic merge, одинаковый текст/разные id, fresh empty/error сохраняет данные, close/cleanup throws/late cleanup, scope expiry и GC. Команда Red: npm run test:integration -- history-api.spec.ts history-query.spec.ts. Подтвердить поведенческий Red. FR-005–FR-008; SC-003–SC-004, SC-006.
- [x] T006 [US2] GREEN: src/lib/messages/{constants,merge-message-facts,message-cache,validate-message}.ts минимальное ядро; src/lib/history/fetch-history.ts; src/lib/query/session-query-error.ts и create-query-session.ts; совместимое наследование ChatsQueryError в src/lib/chats/types.ts и type callback QueryProvider при необходимости. Применение immutable и synchronous, session active=false перед cleanup/cancel/clear; defaults Query сообщений до setQueryData. Команда T005 до Green, зависимость: T005.
- [x] T007 [US2] RED: tests/query/history-query.spec.ts и tests/fixtures/query-app/components/HistoryProbe/{HistoryProbe.tsx,index.ts}, страницу фикстуры app/page.tsx. Два consumers одного accessId, повтор открытия того же/другого чата, A→B→A, ручной refresh, мобильный возврат/close, StrictMode и отсутствие фальшивого pending после закрытия. Команда: npm run test:query -- tests/query/history-query.spec.ts. Не сломать существующий QueryProbe. FR-002, FR-005–FR-008; SC-001, SC-003–SC-004, SC-006.
- [x] T008 [US2] GREEN: src/lib/history/use-chat-history.ts по контракту 025/accessId и отдельному request key; subscriber merged messages, проверка принадлежности предыдущих выполнений, retry: false/gcTime: 0 без самостоятельной фоновой загрузки. Команда T007 до Green; зависимости: T006,T007. Затем Refactor hook с теми же зелёными проверками, без shared API changes.

## US1 — Консоль свежего результата

- [x] T009 [US1] RED: дополнить tests/query/history-query.spec.ts и HistoryProbe проверкой свежего snapshot в консоли, без подмены накопленным кешем, пустого/короткого ответа, одинакового нового JSON в одном tick при structuralSharing, StrictMode/несколько consumers, normalized error и подавления late log. Команда T007; поведенческий Red обязателен. FR-004–FR-005, FR-007–FR-009; SC-002–SC-003, SC-005–SC-006.
- [x] T010 [US1] GREEN: src/components/ChatHistoryController/{ChatHistoryController.tsx,index.ts,constants.ts}, mount через conversation slot src/app/page.tsx после 025. Невидимый контроллер возвращает null; лог только актуального нормализованного результата один раз на фактическое завершение. Команда T009 до Green; зависимость: T009. Не менять SCSS/макет.
- [x] T011 [US1] REFACTOR: сохранить единый request и suppress duplicate log, проверить ручной повтор и lifecycle 014 в полном query-наборе. Повторить T005/T007/T009 после серии правок. Зависимость: T010.

## Finish

- [x] T012 Прогнать итоговый подходящий набор [quickstart](quickstart.md): целевые integration/query/E2E проверки, npm run typecheck, npm run lint, npm run format:check для исходников и тестов, отдельный Prettier check документации с --ignore-path NUL. Закрыть acceptance.md фактическими Passed/Failed/Blocked; не выдавать NotRun за успех. Зависимость: T011. Кодовые проверки/acceptance и общий Prettier check28 документов после DOC FREEZE:Passed.
- [x] T013 Сверить все FR/SC, выполнить read-only precommit review без git add/commit; проверить отсутствие UI/sending/SSE/pagination/storage/list-policy изменений. C1–C8 и документация текущего состояния; зависимость: T012.
- [x] T014 Создать specs/018-chat-history-console/verification.md только с фактическими Red/Green/командами/результатами и ссылками; обновить completed tasks по доказательствам, сообщить следующий шаг 019 и английский вариант коммита `feat: load fresh chat history with scoped query cache`. Никакого выполнения Git. Отчёт передан основному агенту; T012/T013 завершены фактически, без Git mutations.

## Traceability

| Требование    | Задачи                   |
| ------------- | ------------------------ |
| FR-001–FR-003 | T002–T004,T007–T008,T012 |
| FR-004        | T009–T011,T012           |
| FR-005        | T005–T011,T012           |
| FR-006        | T002–T006,T011–T012      |
| FR-007        | T005–T011,T012–T013      |
| FR-008        | T005–T008,T011–T012      |
| FR-009        | T002–T004,T009–T013      |
| SC-001        | T002–T004,T007–T008,T012 |
| SC-002        | T002–T004,T009–T012      |
| SC-003–SC-004 | T005–T012                |
| SC-005        | T004,T009–T013           |
| SC-006        | T005–T012                |

T001 — обязательный актуальный контекст; T013–T014 — процесс завершения C7,
не новые продуктовые функции. Серверный и React Red подтверждены; Green и итоговая
регрессия Passed: integration 198, Query 18, E2E 88. Анализ root выполняет
отдельно после заморозки writers. Ни одна задача не разрешает код сама по себе.

## Уровни проверки реализации

Серверный handler/provider/fetch/merge/lifecycle Red подтверждён одним набором
из 23 тестов до реализации: 22 Failed и 1 Passed. React hook/controller Red
подтверждён отдельной fixture-сборкой: 5 Failed по отсутствию HTTP/console.
E2E real route написан после handler Red и проверяет wiring/регрессию;
искусственный Red откатом реализованного поведения не выполняется.
Исправление фактического loopback Origin после первой E2E проверки подтверждено
отдельным Red 4 Failed → Green 4 Passed до итоговой регрессии. Green, рефакторинг
и регрессия проверены общими наборами после пачки правок; конкретные
команды/числа находятся в verification.md.
