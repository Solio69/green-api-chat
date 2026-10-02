# Implementation Plan: история выбранного чата в консоль

**Spec**: [spec.md](spec.md)
**Дата**: 2026-10-02
**Согласование spec.md**: Пользователь согласовала 018–025 2026-10-02
**Разрешение на реализацию**: Пользователь разрешила параллельную реализацию получения истории 2026-10-02; авторизация сохранена в spec/tasks.
**Статус**: Реализовано; общая автоматическая регрессия Passed. Итоговый read-only analyze после заморозки документов выполняет основной агент.

## Summary

POST /api/chats/history читает GetChatHistory с серверным count: 10 и cookie.
Обработчик проверяет same-origin Origin до чтения тела и вызова поставщика.
Событие выбора 025 запускает свежий запрос для каждого обращения. Query хранит
свежий ответ отдельно от накопленных сообщений; невидимый контроллер выводит
только результат актуального обращения. Интерфейс истории, отправка и
производители уведомлений в этом шаге не создаются.

## Considered Options

Варианты, риски и причины решений записаны в [research.md](research.md).
Выбраны ключ отдельного обращения, отдельное синхронное слияние, общий lifecycle 014 и
ограниченный повтор 429 идемпотентного чтения. Cursor/pagination не добавляются.

## Technical Context

TypeScript/React/Next.js Node; текущие версии перечислены в research.
Хранение — Query в памяти; тесты — существующие Playwright integration/query/E2E.
Реквизиты поставщика остаются на сервере. Контракт события выбора 025 реализован
до wiring 018; номер 025 не означает зависимость от уведомлений.
Новые пакеты/инструменты/хостинг не нужны.

## Constitution Check

| Принцип | Результат | Основание                                                              |
| ------- | --------- | ---------------------------------------------------------------------- |
| C1      | PASS      | Spec и решения согласованы; авторизована реализация 018                |
| C2      | PASS      | Узкий результат консоли; UI/отправка/очередь отдельно                  |
| C3      | PASS      | Отдельное разрешение 2026-10-02 записано в spec/tasks                  |
| C4      | PASS      | Git read-only по GIT_POLICY                                            |
| C5      | PASS      | Нет установки/миграций/изменения данных                                |
| C6      | PASS      | Явный выбор 018, фиктивные данные, Пользовательские правки сохраняются |
| C7      | PASS      | Серверный и React Red подтверждены; итоговые проверки в verification   |
| C8      | PASS      | Существующие инструменты, общая модель без нового store                |

## Research and Design

- [Research](research.md), [модель](data-model.md), [HTTP](contracts/history-api.md), [Query/lifecycle](contracts/history-query.md), [quickstart](quickstart.md).
- [Общая модель 019](../019-chat-history-window/contracts/message-cache.md) — источник типов/слияния; 018 создаёт минимальное ядро до UI 019, поэтому нет цикла реализации.
- [Выбор 025](../025-conversation-selection/spec.md), [существующий Query 014](../014-chat-list-query/contracts/query-layer.md).

## Project Structure

Перечень файлов реализации и проверок этого шага. Фактические результаты — в verification.md.

| Файл                                                              | Действие и цель                                                                                         |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| src/lib/history/types.ts                                          | Новые результаты адаптера поставщика/HistoryQueryError/типы HTTP-контракта                              |
| src/lib/history/constants.ts                                      | count: 10, Query keys и подписи диагностики без magic values                                            |
| src/lib/history/validate-history-request.ts                       | Проверка тела истории                                                                                   |
| src/lib/history/normalize-history.ts                              | DTO только с разрешёнными полями, media→unsupported                                                     |
| src/lib/history/handle-history-request.ts                         | Scope/session/контракт ошибок                                                                           |
| src/lib/history/fetch-history.ts                                  | Клиентский fetch с guards/status/JSON                                                                   |
| src/lib/history/use-chat-history.ts                               | Query отдельного обращения и merge subscription                                                         |
| src/lib/green-api/get-chat-history.ts                             | Адаптер POST поставщика/abort/deadline/retry                                                            |
| src/lib/green-api/constants.ts                                    | Только имя getChatHistory                                                                               |
| src/lib/http/constants.ts                                         | Origin, Host, HTTP(S) protocol и credentials same-origin                                                |
| src/lib/routes/constants.ts                                       | Только CHAT_HISTORY_API                                                                                 |
| src/lib/chats/validate-chat-id.ts                                 | Общие isChatId/isPersonalChatId opaque-совместимые с 014, без group/phone aliases                       |
| src/lib/messages/types.ts                                         | Общий MessageDTO                                                                                        |
| src/lib/messages/constants.ts                                     | Messages key/gc и семантические значения                                                                |
| src/lib/messages/merge-message-facts.ts                           | Чистое id-слияние history и статусной прогрессии                                                        |
| src/lib/messages/validate-message.ts                              | Общая проверка MessageDTO при клиентском чтении и применении фактов                                     |
| src/lib/messages/message-cache.ts                                 | Минимальный Query updater с проверками принадлежности истории                                           |
| src/lib/query/session-query-error.ts                              | Общая normalized ошибка                                                                                 |
| src/lib/query/create-query-session.ts                             | scope/cleanup/общий обработчик ошибок сессии, сохранить 014                                             |
| src/lib/chats/fetch-chats.ts                                      | Общая константа same-origin без изменения поведения списка 014                                          |
| src/lib/chats/types.ts                                            | Сохранить API ChatsQueryError через общий базовый класс                                                 |
| src/app/api/chats/history/route.ts                                | POST в Node runtime, cookie и вызов адаптера                                                            |
| src/components/ChatHistoryController/ChatHistoryController.tsx    | Невидимый запуск и свежий результат в консоли                                                           |
| src/components/ChatHistoryController/index.ts                     | Публичный export                                                                                        |
| src/components/ChatHistoryController/constants.ts                 | Диагностические labels                                                                                  |
| src/app/page.tsx                                                  | Передать невидимый контроллер в существующий conversation slot; Workspace/025 fixture без побочной сети |
| tests/history/constants.ts                                        | Только общие фиктивные данные для проверок                                                              |
| tests/integration/history-api.spec.ts                             | Normalization/provider/handler Red/Green                                                                |
| tests/integration/history-query.spec.ts                           | Fetch/merge/lifecycle/abort Red/Green                                                                   |
| tests/integration/chat-query.spec.ts                              | Существующая регрессия 014 ошибок/cleanup; поведение не меняется                                        |
| tests/query/history-query.spec.ts                                 | Выбор в React/dedup/console/StrictMode                                                                  |
| tests/fixtures/query-app/components/HistoryProbe/HistoryProbe.tsx | Изолированная фикстура истории                                                                          |
| tests/fixtures/query-app/components/HistoryProbe/index.ts         | Экспорт фикстуры                                                                                        |
| tests/fixtures/query-app/app/page.tsx                             | Подключить новую фикстуру без изменения ChatProbe                                                       |
| tests/e2e/history-api.spec.ts                                     | Cookie и HTTP-методы/no-store                                                                           |
| tests/e2e/fixtures/history-scenarios.json                         | Фиктивные ответы поставщика                                                                             |
| tests/e2e/fixtures/fake-green-api.ts                              | Распознавание getChatHistory в fake                                                                     |
| specs/018-chat-history-console/verification.md                    | Только фактические Red/Green и итог после реализации                                                    |

Docs этого этапа: spec.md, plan.md, research.md, data-model.md,
contracts/history-api.md, contracts/history-query.md, quickstart.md, tasks.md,
checklists/requirements.md и checklists/acceptance.md. analysis.md запишется
отдельно после заморозки writers и полного read-only прохода root.

## Tasks and Dependencies

Событие выбора 025 → T001–T004 Сервер: Red/Green/Refactor → T005–T008
Query/lifecycle: Red/Green/Refactor → T009–T011 controller/browser: Red/Green →
T012–T014 общая регрессия/review/verification. Каждый Green зависит от
подтверждённого поведенческого Red соответствующего этапа.
Реальные SSE/SendMessage и интерфейс истории 019 не нужны для изолированных проверок.

## Verification

API: ошибки, отрицательные Origin, нормализация, count: 10, no-store и отмена. Проверяются несколько подписчиков Query,
свежая загрузка при возврате/A→B→A, сохранение известных сообщений, свежий snapshot в консоли, а не merged cache, close/errors,
StrictMode и регрессия 014. Red обязан упасть из-за отсутствующего поведения,
а не ошибки импорта или пакетов. После правок общий набор подтвердил 198 integration,
18 Query и 88 E2E Passed; сборка, typecheck, lint и format:check Passed.
Фактические результаты и ограничение ручной проверки указаны в verification.md.
Непроведённые проверки остаются NotRun. Реальные сообщения в отчёт не сохраняются.

## Post-design Constitution Check

C1–C8: PASS по тем же основаниям. Общее ядро создаётся в 018 для FR-007.
Будущие производители 019/021/023/024 не объявлены реализованными. Временный
ключ запроса нужен для свежего результата в консоли и защиты от гонок;
Query gcTime: Infinity действует до закрытия области подключения.

## Complexity Tracking

Новая инфраструктура и новые пакеты не нужны. Дополнительный ключ свежего ответа и
ядро слияния позволяют получить актуальный результат и сохранить уже известные
сообщения. Общий lifecycle защищает контракт 014 без независимых эффектов выхода.
