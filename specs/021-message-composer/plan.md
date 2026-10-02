# Implementation Plan: форма и отправка

**Spec**: [spec.md](spec.md). **Дата**: 2026-10-02.
**Согласование spec.md**: пользователь согласовал комплект 018–025 2026-10-02.
**Разрешение на реализацию**: CodeNotAuthorized; только технические документы.

## Summary

MessageSendProvider внутри живого workspace управляет одной useMutation и
синхронным latch; MessageComposer держит только текущий ввод. Отправка original
text через 020 после accepted/idMessage пополняет общие message cache/session
chat facts 019. Switch/close очищают ввод, не теряют pending и не перенаправляют
результат. Только рабочая вкладка 023 имеет доступ; unknown не вызывает retry.

## Considered Options

| Вариант                                  | Преимущества                                      | Ограничения                                         | Решение          |
| ---------------------------------------- | ------------------------------------------------- | --------------------------------------------------- | ---------------- |
| useMutation внутри conditional composer  | Меньше структуры                                  | Unmount теряет callbacks и общий pending            | Не выбран        |
| Живой provider + component current input | Один pending на подключение, navigation безопасна | Один provider/public hook                           | Выбран           |
| TanStack scope очередь                   | Сериализация встроена                             | Автоматический отложенный send нарушает user choice | Не выбран        |
| Optimistic bubbles / persistent drafts   | Быстрый feedback/восстановление                   | Несогласованные данные/корреляция                   | Не входят в spec |

## Technical Context

Node 24 / Next 16.3.7 / React 19.3.0 / Query 5.104.0 / Playwright 1.63.0
установлены. src/components/QueryProvider сейчас является границей Query lifetime;
ChatWorkspace сохраняет server slots, поиск работает без открытия переписки.
025 обеспечивает ConversationSelectionProvider/ConversationPane и composer slot;
019 — единый cache/overlay; 023 — NotificationProvider/право владельца.
021 не добавляет store/Zustand, QueryClient, пакеты, durable drafts или CSS-редизайн.

## Constitution Check

| Принцип | Результат | Основание до проектирования                                                |
| ------- | --------- | -------------------------------------------------------------------------- |
| C1      | PASS      | Все существенные решения формы/ошибок/текста приняты пользователем         |
| C2      | PASS      | Форма отделена от API, истории, выбора и очереди                           |
| C3      | PASS      | Spec согласована, код ожидает отдельное разрешение после analysis          |
| C4      | PASS      | Git/staging не меняются, актуальные пользовательские изменения сохраняются |
| C5      | PASS      | Existing packages достаточны; кабинет/инфраструктуру агент не меняет       |
| C6      | PASS      | Только текущий текст и session memory; capability не публикуется           |
| C7      | PASS      | Поведенческий Red до реализации; real React/HTTP сценарии и NotRun         |
| C8      | PASS      | Один provider/latch и общие helpers вместо новых stores/queues             |

## Research and Design

- [research.md](research.md): mutation lifetime/networkMode/latch/races.
- [data-model.md](data-model.md): snapshot vs current editor, original text.
- [contracts/send-controller.md](contracts/send-controller.md): mutation/HTTP/cache.
- [contracts/composer.md](contracts/composer.md): ввод, unknown, a11y и список.
- [quickstart.md](quickstart.md): exact future verification commands.
- [checklists/acceptance.md](checklists/acceptance.md): приемочные сценарии NotRun.
- [Общий контракт](../../docs/messaging-specs.md): identity/owner/status/cache roles.

Предложенное техническое решение обосновано конкретными рисками unmount,
синхронного двойного submit и поздних ответов. retry:false/networkMode:'always'
не допускают offline паузу с последующей автоматической отправкой. selectionEpoch
и editorRevision защищают очистку текста; accessId отвечает только за историю.
AcceptedAt — local epoch ms, provider timestamp не выдумывается.
023 предоставляет точный закрытый OwnerContext {connectionScope,ownerEpoch:string,
ownerCapability}, captureOwnerContext и isCurrentOwnerContext. Новый Send требует
canSend и captured context; публикация результата проверяет лишь retained context,
сохраняя already-started acceptance при10s grace, без угадывания epoch по UI status.

## Project Structure

Будущие новые файлы:

- src/components/MessageSendProvider/MessageSendProvider.tsx — живой owner одного
  useMutation/latch и применения confirmed фактов; index.ts — public exports.
  Использует useNotificationOwner из NotificationProvider/index.ts и owner context
  controller API 023, не читает секрет через public UIhook.
- src/components/MessageComposer/MessageComposer.tsx — текущее поле/keyboard/ошибка.
- src/components/MessageComposer/constants.ts — доступные названия/состояния.
- src/components/MessageComposer/index.ts — публичный компонент.
- src/components/MessageComposer/MessageComposer.module.scss — минимальные
  существующие tokens для согласованного макета UI-016–018, без новых вариантов.
- src/lib/sending/fetch-send-message.ts — клиентская валидация и dispatch 020.
- src/lib/sending/editor-guards.ts — pure snapshot/current revision guard,
  совместный handler Enter/IME, не новая state abstraction.
- tests/integration/message-send.spec.ts — pure guards/client parser/unknown.
- tests/query/message-composer.spec.ts — реальные React/provider/component cases.
- tests/fixtures/query-app/components/MessageComposerProbe/MessageComposerProbe.tsx
  и index.ts — real React стенд с fake transport и 025 context.
- tests/fixtures/query-app/app/sending/page.tsx — новая отдельная страница стенда
  MessageComposerProbe, не заменяющая существующий QueryProbe.
- tests/e2e/message-composer.spec.ts — первый chat, HTTP/owner/unknown/manual.
- specs/021-message-composer/verification.md — будущий фактический отчёт.

Будущие изменяемые файлы:

- src/lib/sending/types.ts — добавить client SendMessageError/AttemptResult к
  безопасным DTO из 020, без изменения серверного AcceptedSend контракта.
- src/components/ChatWorkspace/ChatWorkspace.tsx — поместить MessageSendProvider
  внутри ConversationSelectionProvider и вне conditional ConversationPane;
  account/search/chatList server slots и NotificationProvider сохраняются.
- src/components/ConversationPane/ConversationPane.tsx — composer:ReactNode slot;
  существующий children/history slot и согласованная структура сохраняются.
- tests/e2e/fixtures/fake-green-api.ts и send-scenarios.json — добавить только
  нужные delayed/unknown/accepted формы, не заменить fixture из 020.

020 уже владеет sending/types/constants/validate; DTO используются без параллельной
переопределённой модели. 021 добавляет client SendMessageError и AttemptResult в
src/lib/sending/types.ts как отдельные клиентские типы, не меняя AcceptedSend.
Новые поля строго из необходимости client cases, через
согласованный контракт, без переименования shared ошибок. 019 владеет
src/lib/messages/message-cache.ts и src/lib/chats/session-chat-facts.ts;
021 не добавляет вторую коллекцию/overlay. 025 владеет selection/mobile transitions.
Shared src/lib/messages/message-status-issues.ts и publishMessageIssues
принадлежат core 019 и готовы до 021; returned merge issues не пропускаются.
Наблюдаемые status/error outlets — последующая 024, а не compile prerequisite.

## Tasks and Dependencies

[tasks.md](tasks.md): preflight → client/guard Red → Green → real React Red
→ provider/composer wiring Green → full-chain E2E Red → минимальная интеграция
Green → Refactor/final checks → visual/a11y/review/verification.
Истории US1/US2/US3 реализуются последовательно, а не параллельным изменением
workspace несколькими агентами. Контрактные tests могут использовать fake
transport, но полный пользовательский сценарий зависит от 018/019/020/022/023/025.
Общий DAG подготовки исполнения: 025 → 018 → 019 → 022 → 023 → 020 → 021 → 024.
Факты статусов уже корректно сохраняются в 019; их отдельный UI появляется в 024.

## Verification

Исполнение NotRun. Integration:
`npm run test:integration -- tests/integration/message-send.spec.ts`;
real React: `npm run test:query -- tests/query/message-composer.spec.ts`;
HTTP: `npm run test:e2e -- tests/e2e/message-composer.spec.ts`.

Red подтверждается нужным failure behavior, например duplicate send/потеря
pending/очистка текста Б/неприменение accepted, не missing module/build.
Для type-compatible стенда допустим только каркас после разрешения кода.
Те же тесты подтверждают Green. Итоговый набор после рефакторинга — quickstart,
соответствие всех FR/SC по coverage tasks и manual screenshot макета 320/1280.
Не выполнять реальные отправки автоматически; capability и реальные данные
не сохраняются в browser trace/снимках.

## Post-design Constitution Check

| Принцип | Результат после проектирования | Основание                                                        |
| ------- | ------------------------------ | ---------------------------------------------------------------- |
| C1      | PASS                           | Original text/unknown/current input согласованы                  |
| C2      | PASS                           | Форме не присвоены API/selection/SSE/история                     |
| C3      | PASS                           | CodeNotAuthorized после Approved spec                            |
| C4      | PASS                           | Staging/чужой UI сохранены; документы только owned feature       |
| C5      | PASS                           | Existing tools, без пакетов и аккаунтных изменений               |
| C6      | PASS                           | Current session memory, capability не в публичном result         |
| C7      | PASS                           | Integration/React/E2E Red→Green и coverage всех FR/SC; NotRun    |
| C8      | PASS                           | Shared core019 и один provider вместо store/queue, DAG без цикла |

Код и тесты не начаты. Единственная
дополнительная сложность — один живой provider/latch/snapshot guard, требуемая
согласованной одной отправкой и навигацией во время ожидания. Analysis будет
read-only отдельно после завершения комплектов; данный план не является отчётом.

## Complexity Tracking

Нет temp IDs для пузырей, per-chat draft storage, offline outbox, retry,
persister или second QueryClient. Existing tokens/макет сохраняются; CSS только
для ранее согласованной формы, самостоятельного редизайна нет. Технические
shared контракты согласуются до analysis, существенных продуктовых вопросов нет.
