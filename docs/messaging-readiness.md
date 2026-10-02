# Готовность комплекта истории, получения и отправки

**Дата**: 2026-10-02. **Стадия**: техническая подготовка завершена.
**Результат анализа документов**: Passed, неустранённых разногласий нет.
**Реализация**: 025 и018 разрешены отдельно, реализованы и закоммичены пользователем.
019: CodeAuthorized 2026-10-02, изолированная реализация по макету Passed; T011 — NotRunExternal. 020–024: CodeNotAuthorized, исполняемые проверки пока NotRun. Фактические результаты:
[025 verification](../specs/025-conversation-selection/verification.md),
[018 verification](../specs/018-chat-history-console/verification.md), [019 verification](../specs/019-chat-history-window/verification.md).

Пользователь согласовал восемь spec 018–025 и поручил параллельно подготовить весь
комплект документов. Три субагента подготовили историю, отправку и получение;
координатор подготовил выбор переписки и сверил общие границы. Существенные
решения пользователя собраны в [общем комплекте](messaging-specs.md).
Это полный отчёт по готовности комплекта. Выбор025 и история018 в консоли
реализованы и закоммичены; отображение019 разрешено отдельно и изолированно проверено, отправка и уведомления требуют отдельного разрешения.

## Результат по задачам

Покрытие в таблице — запланированные проверки требований и критериев, а не
выполненные тесты остальных feature. У025 выполнены10 задач, у018 —14;
В019 выполнены13 из14 задач; T011 остаётся NotRunExternal. Всего выполнены37 задач018/019/025; 63 задачи не отмечены.

| Feature                                            | Назначение                 | FR  | SC  | Задач | Покрытие | Анализ                                                    |
| -------------------------------------------------- | -------------------------- | --- | --- | ----- | -------- | --------------------------------------------------------- |
| [018](../specs/018-chat-history-console/spec.md)   | История в консоль          | 9   | 6   | 14    | 100%     | [Passed](../specs/018-chat-history-console/analysis.md)   |
| [019](../specs/019-chat-history-window/spec.md)    | История и общий кеш        | 12  | 6   | 14    | 100%     | [Passed](../specs/019-chat-history-window/analysis.md)    |
| [020](../specs/020-send-message-api/spec.md)       | Серверная отправка         | 10  | 5   | 12    | 100%     | [Passed](../specs/020-send-message-api/analysis.md)       |
| [021](../specs/021-message-composer/spec.md)       | Форма отправки             | 13  | 7   | 17    | 100%     | [Passed](../specs/021-message-composer/analysis.md)       |
| [022](../specs/022-notification-receiver/spec.md)  | Получатель очереди         | 13  | 6   | 11    | 100%     | [Passed](../specs/022-notification-receiver/analysis.md)  |
| [023](../specs/023-notification-sse/spec.md)       | SSE и обработка в браузере | 13  | 6   | 11    | 100%     | [Passed](../specs/023-notification-sse/analysis.md)       |
| [024](../specs/024-message-statuses/spec.md)       | Статусы сообщений          | 13  | 5   | 11    | 100%     | [Passed](../specs/024-message-statuses/analysis.md)       |
| [025](../specs/025-conversation-selection/spec.md) | Выбор переписки            | 10  | 5   | 10    | 100%     | [Passed](../specs/025-conversation-selection/analysis.md) |

Итого: 93 FR, 46 SC, 139 требований/критериев, 100 задач. Неохваченных FR/SC,
повторяющихся T-ID, непривязанных задач и параллельных шагов реализации нет.
Процессные задачи имеют основание C3/C4/C7/C8. Все документы feature перечислены
ниже; пути будущих исходников и тестов подробно перечислены в каждом plan.

## Порядок будущей реализации

025 и018 (закоммичены), 019 (изолированно проверена) → 022 → 023 → 020 → 021 → 024.

Это порядок ввода ядра и компонентов, а не утверждение, что сквозная приёмка
каждого шага уже закончена. 025 самостоятельно проверяет выбор и контрактные
слоты. 019 предоставляет проверенный foundation до производителей 023/021;
его T011/SC-005 остаётся NotRunExternal до их отдельной реализации и статусов024.
После интеграции нужно закрыть эту совместную приёмку и обновить verification019.
Аналогично реальная браузерная приёмка получателя022 требует SSE023.
Ни stub, ни review документов не заменяет соответствующие HTTP/браузерные тесты.

Каждый этап начинается после отдельного разрешения кода, с чтения актуального
diff и исходного покрытия. Новая логика идёт Red → Green → Refactor;
существующие общие helper перед рефакторингом проверяются baseline-тестами.

## Общие контракты и владельцы будущих изменений

| Область/файлы                                                                         | Владелец и порядок                             | Зафиксированная граница                                                                         |
| ------------------------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| ConversationSelectionProvider, ChatWorkspace, ChatList/Panel, RecipientSearchForm     | 025, затем точечная интеграция019/021/023      | Один выбор; accessId открытия отдельно от selectionEpoch смены; SSR-слоты сохраняются           |
| create-query-session.ts, QueryProvider, доменные errors                               | 018, затем019/023                              | Один lifecycle и обработчик session errors; cleanup до clear; ownership409 не logout            |
| messages/types, merge-message-facts, message-cache                                    | Минимальное ядро018, производители/подписка019 | Общая identity scope/chatId/idMessage, immutable merge, положительные статусы не понижаются     |
| message-status-issues, use-message-issues, history consumer                           | 019, вызывают021/023                           | Все returned issues публикуются; ошибки без id не назначаются случайному сообщению              |
| session-chat-facts, useChats и labels                                                 | 019, вызывают021/023                           | Локально подтверждённый чат сохраняется при ошибке/отсутствии в GetChats; label не fake profile |
| receiver-registry, loop, normalization/settings adapters, logout route                | 022                                            | Один reader/owner инстанса; только проверенный ACK разрешает Delete; без SetSettings            |
| NotificationProvider, HTTP/SSE/parser/client, ChatHistoryPanel recovery, LogoutButton | 023                                            | Capability в памяти; retained owner API для021; recovery внутри SelectionProvider               |
| send provider/handler/route, safe identifier                                          | 020                                            | Один upstream вызов, server owner lock, строгий Origin, нулевой автоматический retry            |
| MessageSendProvider/Composer, conversation slot                                       | 021                                            | После idMessage вставка в исходный чат; поздний ответ проверяет scope/owner/editor отдельно     |
| normalize-message-status, status presenter/outlets                                    | Server normalizer022, shared reducer019, UI024 | Строгая identity, bounded ранние факты; actual status, общий отказ без догадки                  |
| shared API/HTTP/routes constants и fixture app                                        | Последовательно соответствующие feature        | Manifest каждого plan; не перезаписывать изменения предыдущего шага или staging                 |

Между contracts совпадают MessageDTO/MessageStatusFact/ChatIssueFact,
applyMessageFacts/addAcceptedMessage/publishMessageIssues, session chat overlay,
QuerySession cleanup/error API, OwnerContext/OwnerAccess и заголовки scope/owner.
Настройки списка014 сохраняются. Кеш сообщения и снимок свежего чтения различны.

## Проверки документов и устранённые замечания

Проверены exact prerequisites, содержательное покрытие spec→tasks, TDD-порядок,
зависимости, общие API/модели, относительные ссылки и форматирование.
Prettier проверял документы с --ignore-path NUL: обычный project ignore исключает
docs/specs. Формальная полнота ID сверена отдельно с содержательным ревью.
Проверка существования относительных ссылок проекта пройдена. Абсолютная ссылка
на внешний локальный файл исходного задания в chat-ui-spec проверена отдельно:
файл существует, но не входит в репозиторий. Проверка источников API и
согласованность требований отражены в research.

| Замечание анализа                                                         | Текущее решение                                                                            | Состояние |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------- |
| H018-A01, H019-A02, V020-01, V021-01: неполный будущий formatter coverage | Global npm run format:check для source/tests/shared/fixtures и отдельный docs override NUL | Устранено |
| H019-A01: returned issue мог потеряться при history merge                 | 019 явно включает use-chat-history.ts, публикацию issues и Red/Green wiring                | Устранено |
| H018-A02, H019-A03, V021-02: склейки, UI-ID и selectEpoch                 | Вычитка, UI-014 и единое selectionEpoch                                                    | Устранено |

Неустранённых CRITICAL/HIGH/MEDIUM/LOW findings — 0/0/0/0. Product решения не
менялись ради исправлений. Первый проход и исправления были разными фазами;
финальный анализ повторён на стабильном комплекте. Полные актуальные отчёты
каждой feature доступны в таблице выше.

## Контроль read-only

В read-only проходе технической подготовки проверены список и SHA-256 **470 файлов** проекта.
Актуальные read-only анализы реализации025 и018 сохранены отдельно в их analysis.md.
Инвентарь до/после идентичен; записи выполнялись только отдельно после прохода.
**SHA-256 инвентаря**: 36B394D9A26A47E7AE2F783E485801B96DC7A8A03806A17C012FB14264BFB405.
Исключены .git, node_modules, .next, playwright-report, test-results, coverage,
out, build и tsconfig.tsbuildinfo — metadata, зависимости и генерируемые файлы.
Исходники, конфигурация, docs/specs, правила и локальные scripts включены.
Содержимое секретных файлов не выводилось. analysis.md и этот отчёт записаны
после завершения прохода; обновление самих отчётов не объявляется новой проверкой.

Исходники и тесты изменены в разрешённых границах025/018 и рефакторинга по ревью;
согласованные продуктовые контракты сохранены. Пакеты,
provider settings и Git/index не изменялись.
Существующие пользовательские правки README/014 и staging сохранены.

## Подготовленные файлы

Prepared означает готовый технический документ. Approved — согласованный текст
spec. Passed для analysis/readiness относится к документам. Planned/NotRun
означает будущую реализацию/приёмку, которая сейчас не выполнялась.

| Файл                                                                                                                          | Назначение                                             | Статус                               |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------ |
| [specs/018-chat-history-console/analysis.md](../specs/018-chat-history-console/analysis.md)                                   | Полный read-only анализ, coverage, C1–C8 и метрики     | Passed                               |
| [specs/018-chat-history-console/architecture-notes.md](../specs/018-chat-history-console/architecture-notes.md)               | Согласованная общая схема и практические границы       | Prepared                             |
| [specs/018-chat-history-console/checklists/acceptance.md](../specs/018-chat-history-console/checklists/acceptance.md)         | Приёмка будущей реализации                             | Passed; оператор NotRunExternal      |
| [specs/018-chat-history-console/checklists/requirements.md](../specs/018-chat-history-console/checklists/requirements.md)     | Проверка качества требований                           | Passed, readiness                    |
| [specs/018-chat-history-console/data-model.md](../specs/018-chat-history-console/data-model.md)                               | Состояния, факты и переходы                            | Prepared                             |
| [specs/018-chat-history-console/plan.md](../specs/018-chat-history-console/plan.md)                                           | Технический план, полный future manifest и C1–C8       | Prepared                             |
| [specs/018-chat-history-console/quickstart.md](../specs/018-chat-history-console/quickstart.md)                               | Команды будущих проверок и операторская приёмка        | Prepared; результаты в verification  |
| [specs/018-chat-history-console/research.md](../specs/018-chat-history-console/research.md)                                   | Источники, варианты, решения и ограничения             | Prepared                             |
| [specs/018-chat-history-console/spec.md](../specs/018-chat-history-console/spec.md)                                           | Согласованные сценарии, FR/SC и границы                | Approved 2026-10-02                  |
| [specs/018-chat-history-console/tasks.md](../specs/018-chat-history-console/tasks.md)                                         | Последовательный TDD и FR/SC→T coverage                | Completed14/14                       |
| [specs/018-chat-history-console/verification.md](../specs/018-chat-history-console/verification.md)                           | Фактические Red/Green, регрессия и границы             | Passed; оператор NotRunExternal      |
| [specs/019-chat-history-window/analysis.md](../specs/019-chat-history-window/analysis.md)                                     | Полный read-only анализ, coverage, C1–C8 и метрики     | Passed isolated; T011 NotRunExternal |
| [specs/019-chat-history-window/checklists/acceptance.md](../specs/019-chat-history-window/checklists/acceptance.md)           | Приёмка будущей реализации                             | Passed isolated; T011 NotRunExternal |
| [specs/019-chat-history-window/checklists/requirements.md](../specs/019-chat-history-window/checklists/requirements.md)       | Проверка качества требований                           | Passed isolated; T011 NotRunExternal |
| [specs/019-chat-history-window/data-model.md](../specs/019-chat-history-window/data-model.md)                                 | Состояния, факты и переходы                            | Passed isolated; T011 NotRunExternal |
| [specs/019-chat-history-window/plan.md](../specs/019-chat-history-window/plan.md)                                             | Технический план, полный future manifest и C1–C8       | Passed isolated; T011 NotRunExternal |
| [specs/019-chat-history-window/quickstart.md](../specs/019-chat-history-window/quickstart.md)                                 | Команды будущих проверок и операторская приёмка        | Passed isolated; T011 NotRunExternal |
| [specs/019-chat-history-window/research.md](../specs/019-chat-history-window/research.md)                                     | Источники, варианты, решения и ограничения             | Passed isolated; T011 NotRunExternal |
| [specs/019-chat-history-window/spec.md](../specs/019-chat-history-window/spec.md)                                             | Согласованные сценарии, FR/SC и границы                | Passed isolated; T011 NotRunExternal |
| [specs/019-chat-history-window/tasks.md](../specs/019-chat-history-window/tasks.md)                                           | Последовательный TDD и FR/SC→T coverage                | Passed isolated; T011 NotRunExternal |
| [specs/019-chat-history-window/verification.md](../specs/019-chat-history-window/verification.md)                             | Фактические Red/Green, итоговые проверки и ограничения | Passed isolated; T011 NotRunExternal |
| [specs/020-send-message-api/analysis.md](../specs/020-send-message-api/analysis.md)                                           | Полный read-only анализ, coverage, C1–C8 и метрики     | Passed                               |
| [specs/020-send-message-api/checklists/acceptance.md](../specs/020-send-message-api/checklists/acceptance.md)                 | Приёмка будущей реализации                             | NotRun                               |
| [specs/020-send-message-api/checklists/requirements.md](../specs/020-send-message-api/checklists/requirements.md)             | Проверка качества требований                           | Passed, readiness                    |
| [specs/020-send-message-api/data-model.md](../specs/020-send-message-api/data-model.md)                                       | Состояния, факты и переходы                            | Prepared                             |
| [specs/020-send-message-api/plan.md](../specs/020-send-message-api/plan.md)                                                   | Технический план, полный future manifest и C1–C8       | Prepared                             |
| [specs/020-send-message-api/quickstart.md](../specs/020-send-message-api/quickstart.md)                                       | Команды будущих проверок и операторская приёмка        | Prepared; execution NotRun           |
| [specs/020-send-message-api/research.md](../specs/020-send-message-api/research.md)                                           | Источники, варианты, решения и ограничения             | Prepared                             |
| [specs/020-send-message-api/spec.md](../specs/020-send-message-api/spec.md)                                                   | Согласованные сценарии, FR/SC и границы                | Approved 2026-10-02                  |
| [specs/020-send-message-api/tasks.md](../specs/020-send-message-api/tasks.md)                                                 | Последовательный TDD и FR/SC→T coverage                | Planned, unchecked                   |
| [specs/021-message-composer/analysis.md](../specs/021-message-composer/analysis.md)                                           | Полный read-only анализ, coverage, C1–C8 и метрики     | Passed                               |
| [specs/021-message-composer/checklists/acceptance.md](../specs/021-message-composer/checklists/acceptance.md)                 | Приёмка будущей реализации                             | NotRun                               |
| [specs/021-message-composer/checklists/requirements.md](../specs/021-message-composer/checklists/requirements.md)             | Проверка качества требований                           | Passed, readiness                    |
| [specs/021-message-composer/data-model.md](../specs/021-message-composer/data-model.md)                                       | Состояния, факты и переходы                            | Prepared                             |
| [specs/021-message-composer/plan.md](../specs/021-message-composer/plan.md)                                                   | Технический план, полный future manifest и C1–C8       | Prepared                             |
| [specs/021-message-composer/quickstart.md](../specs/021-message-composer/quickstart.md)                                       | Команды будущих проверок и операторская приёмка        | Prepared; execution NotRun           |
| [specs/021-message-composer/research.md](../specs/021-message-composer/research.md)                                           | Источники, варианты, решения и ограничения             | Prepared                             |
| [specs/021-message-composer/spec.md](../specs/021-message-composer/spec.md)                                                   | Согласованные сценарии, FR/SC и границы                | Approved 2026-10-02                  |
| [specs/021-message-composer/tasks.md](../specs/021-message-composer/tasks.md)                                                 | Последовательный TDD и FR/SC→T coverage                | Planned, unchecked                   |
| [specs/022-notification-receiver/analysis.md](../specs/022-notification-receiver/analysis.md)                                 | Полный read-only анализ, coverage, C1–C8 и метрики     | Passed                               |
| [specs/022-notification-receiver/checklists/acceptance.md](../specs/022-notification-receiver/checklists/acceptance.md)       | Приёмка будущей реализации                             | NotRun                               |
| [specs/022-notification-receiver/checklists/requirements.md](../specs/022-notification-receiver/checklists/requirements.md)   | Проверка качества требований                           | Passed, readiness                    |
| [specs/022-notification-receiver/data-model.md](../specs/022-notification-receiver/data-model.md)                             | Состояния, факты и переходы                            | Prepared                             |
| [specs/022-notification-receiver/plan.md](../specs/022-notification-receiver/plan.md)                                         | Технический план, полный future manifest и C1–C8       | Prepared                             |
| [specs/022-notification-receiver/quickstart.md](../specs/022-notification-receiver/quickstart.md)                             | Команды будущих проверок и операторская приёмка        | Prepared; execution NotRun           |
| [specs/022-notification-receiver/research.md](../specs/022-notification-receiver/research.md)                                 | Источники, варианты, решения и ограничения             | Prepared                             |
| [specs/022-notification-receiver/spec.md](../specs/022-notification-receiver/spec.md)                                         | Согласованные сценарии, FR/SC и границы                | Approved 2026-10-02                  |
| [specs/022-notification-receiver/tasks.md](../specs/022-notification-receiver/tasks.md)                                       | Последовательный TDD и FR/SC→T coverage                | Planned, unchecked                   |
| [specs/023-notification-sse/analysis.md](../specs/023-notification-sse/analysis.md)                                           | Полный read-only анализ, coverage, C1–C8 и метрики     | Passed                               |
| [specs/023-notification-sse/checklists/acceptance.md](../specs/023-notification-sse/checklists/acceptance.md)                 | Приёмка будущей реализации                             | NotRun                               |
| [specs/023-notification-sse/checklists/requirements.md](../specs/023-notification-sse/checklists/requirements.md)             | Проверка качества требований                           | Passed, readiness                    |
| [specs/023-notification-sse/data-model.md](../specs/023-notification-sse/data-model.md)                                       | Состояния, факты и переходы                            | Prepared                             |
| [specs/023-notification-sse/plan.md](../specs/023-notification-sse/plan.md)                                                   | Технический план, полный future manifest и C1–C8       | Prepared                             |
| [specs/023-notification-sse/quickstart.md](../specs/023-notification-sse/quickstart.md)                                       | Команды будущих проверок и операторская приёмка        | Prepared; execution NotRun           |
| [specs/023-notification-sse/research.md](../specs/023-notification-sse/research.md)                                           | Источники, варианты, решения и ограничения             | Prepared                             |
| [specs/023-notification-sse/spec.md](../specs/023-notification-sse/spec.md)                                                   | Согласованные сценарии, FR/SC и границы                | Approved 2026-10-02                  |
| [specs/023-notification-sse/tasks.md](../specs/023-notification-sse/tasks.md)                                                 | Последовательный TDD и FR/SC→T coverage                | Planned, unchecked                   |
| [specs/024-message-statuses/analysis.md](../specs/024-message-statuses/analysis.md)                                           | Полный read-only анализ, coverage, C1–C8 и метрики     | Passed                               |
| [specs/024-message-statuses/checklists/acceptance.md](../specs/024-message-statuses/checklists/acceptance.md)                 | Приёмка будущей реализации                             | NotRun                               |
| [specs/024-message-statuses/checklists/requirements.md](../specs/024-message-statuses/checklists/requirements.md)             | Проверка качества требований                           | Passed, readiness                    |
| [specs/024-message-statuses/data-model.md](../specs/024-message-statuses/data-model.md)                                       | Состояния, факты и переходы                            | Prepared                             |
| [specs/024-message-statuses/plan.md](../specs/024-message-statuses/plan.md)                                                   | Технический план, полный future manifest и C1–C8       | Prepared                             |
| [specs/024-message-statuses/quickstart.md](../specs/024-message-statuses/quickstart.md)                                       | Команды будущих проверок и операторская приёмка        | Prepared; execution NotRun           |
| [specs/024-message-statuses/research.md](../specs/024-message-statuses/research.md)                                           | Источники, варианты, решения и ограничения             | Prepared                             |
| [specs/024-message-statuses/spec.md](../specs/024-message-statuses/spec.md)                                                   | Согласованные сценарии, FR/SC и границы                | Approved 2026-10-02                  |
| [specs/024-message-statuses/tasks.md](../specs/024-message-statuses/tasks.md)                                                 | Последовательный TDD и FR/SC→T coverage                | Planned, unchecked                   |
| [specs/025-conversation-selection/analysis.md](../specs/025-conversation-selection/analysis.md)                               | Полный read-only анализ, coverage, C1–C8 и метрики     | Passed                               |
| [specs/025-conversation-selection/checklists/acceptance.md](../specs/025-conversation-selection/checklists/acceptance.md)     | Приёмка будущей реализации                             | Passed025/018;019/021 NotRunExternal |
| [specs/025-conversation-selection/checklists/requirements.md](../specs/025-conversation-selection/checklists/requirements.md) | Проверка качества требований                           | Passed, readiness                    |
| [specs/025-conversation-selection/data-model.md](../specs/025-conversation-selection/data-model.md)                           | Состояния, факты и переходы                            | Prepared                             |
| [specs/025-conversation-selection/plan.md](../specs/025-conversation-selection/plan.md)                                       | Технический план, полный future manifest и C1–C8       | Prepared                             |
| [specs/025-conversation-selection/quickstart.md](../specs/025-conversation-selection/quickstart.md)                           | Команды будущих проверок и операторская приёмка        | Passed own025                        |
| [specs/025-conversation-selection/research.md](../specs/025-conversation-selection/research.md)                               | Источники, варианты, решения и ограничения             | Prepared                             |
| [specs/025-conversation-selection/spec.md](../specs/025-conversation-selection/spec.md)                                       | Согласованные сценарии, FR/SC и границы                | Approved 2026-10-02                  |
| [specs/025-conversation-selection/tasks.md](../specs/025-conversation-selection/tasks.md)                                     | Последовательный TDD и FR/SC→T coverage                | Done 10/10                           |
| [specs/025-conversation-selection/verification.md](../specs/025-conversation-selection/verification.md)                       | Реальные TDD, проверки реализации025 и ограничения     | Passed own025                        |

## Каждый контракт

| Файл                                                                                                                                                  | Назначение                                                                    | Статус                                           |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------ |
| [specs/018-chat-history-console/contracts/history-api.md](../specs/018-chat-history-console/contracts/history-api.md)                                 | POST истории, cookie/scope/Origin, фиксированный count:10 и безопасный DTO    | Passed; оператор NotRunExternal                  |
| [specs/018-chat-history-console/contracts/history-query.md](../specs/018-chat-history-console/contracts/history-query.md)                             | Свежее обращение, отдельный снимок, общий lifecycle и вывод консоли           | Passed; оператор NotRunExternal                  |
| [specs/019-chat-history-window/contracts/history-view.md](../specs/019-chat-history-window/contracts/history-view.md)                                 | Отображение истории, состояния запроса и прокрутка по существующему макету    | Passed isolated; T011 NotRunExternal             |
| [specs/019-chat-history-window/contracts/message-cache.md](../specs/019-chat-history-window/contracts/message-cache.md)                               | MessageDTO, идентичность, объединение, ранние статусы и публикация ошибок     | Passed isolated; T011 NotRunExternal             |
| [specs/019-chat-history-window/contracts/session-chat-overlay.md](../specs/019-chat-history-window/contracts/session-chat-overlay.md)                 | Локальные принятые/входящие чаты, подписи и объединение с GetChats            | Passed isolated; T011 NotRunExternal             |
| [specs/020-send-message-api/contracts/send-api.md](../specs/020-send-message-api/contracts/send-api.md)                                               | POST отправки, owner lock, исходный текст и принятый/неопределённый результат | Prepared / AnalysisPassed; implementation NotRun |
| [specs/021-message-composer/contracts/composer.md](../specs/021-message-composer/contracts/composer.md)                                               | Ввод, Enter/IME, очистка редактора и ручной повтор после unknown              | Prepared / AnalysisPassed; implementation NotRun |
| [specs/021-message-composer/contracts/send-controller.md](../specs/021-message-composer/contracts/send-controller.md)                                 | Одна отправка, исходный получатель и проверка retained owner context          | Prepared / AnalysisPassed; implementation NotRun |
| [specs/022-notification-receiver/contracts/notification-normalization.md](../specs/022-notification-receiver/contracts/notification-normalization.md) | Проверка envelope и безопасные incoming/status/ignored/malformed события      | Prepared / AnalysisPassed; implementation NotRun |
| [specs/022-notification-receiver/contracts/receiver-runtime.md](../specs/022-notification-receiver/contracts/receiver-runtime.md)                     | Единственный owner/читатель инстанса, ACK→Delete, grace и восстановление      | Prepared / AnalysisPassed; implementation NotRun |
| [specs/023-notification-sse/contracts/notification-client.md](../specs/023-notification-sse/contracts/notification-client.md)                         | Клиентский controller, применение фактов, ACK, owner API и recovery           | Prepared / AnalysisPassed; implementation NotRun |
| [specs/023-notification-sse/contracts/notification-http.md](../specs/023-notification-sse/contracts/notification-http.md)                             | Claim/stream/ACK/release, cookie/scope/capability/Origin и ошибки             | Prepared / AnalysisPassed; implementation NotRun |
| [specs/023-notification-sse/contracts/sse-stream.md](../specs/023-notification-sse/contracts/sse-stream.md)                                           | Формат событий, ограниченный UTF-8 parser, heartbeat и backpressure           | Prepared / AnalysisPassed; implementation NotRun |
| [specs/024-message-statuses/contracts/message-statuses.md](../specs/024-message-statuses/contracts/message-statuses.md)                               | Фактические статусы, строгая корреляция и ошибки без вымышленного пузыря      | Prepared / AnalysisPassed; implementation NotRun |
| [specs/025-conversation-selection/contracts/conversation-selection.md](../specs/025-conversation-selection/contracts/conversation-selection.md)       | Единый target/accessId/selectionEpoch, слоты и навигация                      | Passed own025; integration NotRunExternal        |

## Общие документы

| Файл                                             | Назначение                                                         | Статус                              |
| ------------------------------------------------ | ------------------------------------------------------------------ | ----------------------------------- |
| [messaging-specs.md](messaging-specs.md)         | Все согласованные решения и границы 018–025                        | Согласованный комплект              |
| [chat-ui-spec.md](chat-ui-spec.md)               | Существующий макет и логические состояния без редизайна            | Согласованный референс              |
| [project-overview.md](project-overview.md)       | Актуальная очередь и стадия подготовки сообщений                   | Актуализирован                      |
| [messaging-readiness.md](messaging-readiness.md) | Этот полный отчёт по каждому файлу/контракту и результатам анализа | Подготовлен после read-only прохода |

## Ограничения и непроведённые проверки

Для025 и018 Red/Green/Refactor и общий набор проверок — Passed:
198 integration,18 Query,88 E2E, production build, typecheck/lint/styles/format.
Ревью пользователя и настоящий GREEN-API — NotRun; proxy/SSE и реализация020–024 — NotRun; изолированная019 Passed (211 integration,23 Query,28 целевых E2E).
Совместные HTTP-сценарии019/021 — NotRunExternal. Фактические проверки и задачи
025/018 записаны в их verification/tasks; console018 выводит только текущий snapshot.

Система рассчитана на один постоянный Node-процесс и одну рабочую вкладку на
инстанс. Потеря процесса/страницы теряет память; ACK после применения в Query
не является durable сохранением. Последние10 и удалённая очередь не обещают
полного восстановления всех старых сообщений/статусов. Delete с неопределённым
ответом требует проверки следующего head; abort не доказывает отмену удалённой
отправки. Исход unknown остаётся таким после проверки истории, повтор только
ручной с предупреждением о дубле.

Ранние статусы ограничены 1000 фактами на подключение и TTL300000ms; это
технический предел памяти. Unicode-единица лимита SendMessage не подтверждена
документацией: приложение считает кодовые точки, фактический API-отказ не скрывает.
В примерах Receive и canonical incoming различается наличие chatType: применён
строгий контракт личного чата; реальную форму проверит операторская приёмка,
непроверяемый head не удаляется и не выдаётся за валидный ignored.

После разрешения кода пользователь проверяет settings в кабинете: webhookUrl
пустой, incomingWebhook включён, исходящие переключатели для статусов включены.
Агент не выполняет SetSettings/ClearQueue. Площадка, один Node worker и настройки
proxy/buffering проверяются перед запуском/публикацией; размещение ещё не выбрано.
Новых пакетов, БД или миграций для согласованного плана не требуется.

Pagination, вложения, группы, постоянные черновики/хранение, несколько рабочих
вкладок и новый дизайн отложены. Продуктовых вопросов, препятствующих подготовке
этих восьми feature, нет. Следующий шаг возможен после отдельного решения
пользователя по коду022; 025 и018 завершены в своих границах и закоммичены пользователем. 019 реализована и изолированно проверена; совместный SC-005 пока NotRunExternal.
