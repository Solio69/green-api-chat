# Готовность комплекта истории, получения и отправки

**Дата**: 2026-10-02. **Реализация**: Completed / CodeAuthorized.
018–025 согласованы; прямое поручение разрешило все оставшиеся задачи до024.
Все100 задач выполнены, включая совместную T011 истории019. Автоматическая
приёмка PassedSynthetic: 342 integration,30 Query,99 production E2E и сборка.
Реальный GREEN-API, ручное ревью и публикация: NotRun.
Ниже покрытие означает карту требований→задачи; оно не является процентом
тестового покрытия строк. Согласованные решения: [общий комплект](messaging-specs.md).

## Покрытие и полный анализ

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
ниже; пути исходников и тестов подробно перечислены в каждом plan.

## Порядок реализации и общие границы

025→018→019 foundation→020 core→022→023→020 HTTP→021→024→019 совместная приёмка.
CodeAuthorized получено2026-10-02; повторных gate не требовалось.
Новая логика проверена Red→Green→Refactor; существующий merge019 — baseline.
Отдельный production E2E Red перед wiring не фиксировался: бизнес-поведение
уже проверялось React Red, production цепочка проверена как регрессия.

Shared core019 владеет MessageDTO/cache/early facts/issues и локальными чатами.
022 владеет инстансом/registry/loop/settings,023 — private proof/SSE/ACK/recovery,
020 — Send API/Origin/server lock,021 — editor/mutation,024 — status presentation.
Scope не равен очереди инстанса. ACK происходит после apply/осознанного skip;
уточняющий GetChats не удерживает ACK. Старый history не стирает live/accepted.
Registry один на процесс и общий для route bundles, HMR invalidation дожидается drain.
Только один постоянный Node runtime; многопроцессный hosting не заявлен.

## Доказательства и документы

| Feature | Проверки                                         | Авторитетные документы                                                                                                         |
| ------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| 019     | Совместная T011/SC-005 PassedSynthetic           | [verification](../specs/019-chat-history-window/verification.md)                                                               |
| 020     | API/Origin/validation/single dispatch/owner      | [verification](../specs/020-send-message-api/verification.md), [analysis](../specs/020-send-message-api/analysis.md)           |
| 021     | Editor/Enter/IME/pending/unknown/layout          | [verification](../specs/021-message-composer/verification.md), [analysis](../specs/021-message-composer/analysis.md)           |
| 022     | Single reader/ACK→Delete/drain/pause/recovery    | [verification](../specs/022-notification-receiver/verification.md), [analysis](../specs/022-notification-receiver/analysis.md) |
| 023     | HTTP/stream/parser/apply/ACK/reconnect/isolation | [verification](../specs/023-notification-sse/verification.md), [analysis](../specs/023-notification-sse/analysis.md)           |
| 024     | Statuses/no-id issues/monotonic/early identity   | [verification](../specs/024-message-statuses/verification.md), [analysis](../specs/024-message-statuses/analysis.md)           |

В каждом каталоге сохранены spec/plan/tasks/research/data-model/quickstart,
contracts, checklists/requirements и acceptance, полный analysis и verification.
Точная карта FR/SC→T-ID находится в tasks и analysis соответствующей feature.
Rules/code style, formatter source и отдельный Markdown override NUL проверены.
Итоговый read-only inventory/hash и C1–C8 сохранены в analysis после отдельного
замороженного прохода. Настоящие настройки/очередь/сообщения агент не менял,
пакеты не устанавливал, Git/index не изменял.

Самостоятельное ревью кода и превью завершено в пределах текущего макета:
локальный composer hook/feedback, контекст уведомлений без цикла, смысловые
константы и оформление восстановления. Доказательства и границы:
[verification021](../specs/021-message-composer/verification.md#ревью-компонентов-и-превью).

## Следующий шаг

Пользовательское ревью и проверка реального инстанса по README/quickstart024.
Remote settings проверяет и при необходимости меняет пользователь.
Сквозная цепочка ReceiveNotification→SSE→apply→ACK→Delete реализована;
SendMessage один вызов без autoretry, accepted не выдаётся за delivered/read.
История последние10 + Query RAM, без durable storage/pagination.
Вопросов по согласованному поведению нет. Публикация — отдельный этап E06.
